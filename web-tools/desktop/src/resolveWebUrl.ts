import http from 'node:http'

/** Nuxt dev 在 macOS 上常只监听 [::1]，必须用 localhost 而非 127.0.0.1 */
const DEV_HOSTS = ['localhost', '127.0.0.1'] as const
const DEV_PORTS = [3000, 3001, 3002, 3003] as const

/** 首选路由；dev 偶发 500 时回退 `/`（根路径会 307 到 desktop/search） */
const PROBE_PATHS = ['/desktop/search', '/'] as const

const WEB_TOOLS_MARKERS = ['nexus-desktop', 'Nexus Tools', '__NUXT__', 'desktop/search'] as const

/** 仅发现 3000 时快速复查，给「3000 被占 → Nuxt 落到 3001」留时间（总计约 600ms） */
const PREFER_HIGHER_PORT_RECHECKS = 3
const PREFER_HIGHER_PORT_RECHECK_MS = 200

type DevEndpoint = { host: (typeof DEV_HOSTS)[number]; port: number }

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function looksLikeWebTools(body: string): boolean {
  return WEB_TOOLS_MARKERS.some((m) => body.includes(m))
}

function probePath(host: string, port: number, path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}${path}`, (res) => {
      if (!res.statusCode || res.statusCode >= 500) {
        res.resume()
        resolve(false)
        return
      }
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => {
        if (body.length < 8192) body += chunk
      })
      res.on('end', () => resolve(looksLikeWebTools(body)))
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1200, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function probeWebTools(host: string, port: number): Promise<boolean> {
  for (const path of PROBE_PATHS) {
    if (await probePath(host, port, path)) return true
  }
  return false
}

async function findWebToolsEndpoints(): Promise<DevEndpoint[]> {
  const checks = DEV_PORTS.flatMap((port) =>
    DEV_HOSTS.map((host) => ({ host, port }))
  )
  const results = await Promise.all(
    checks.map(async ({ host, port }) =>
      (await probeWebTools(host, port)) ? ({ host, port } as DevEndpoint) : null
    )
  )
  return results.filter((ep): ep is DevEndpoint => ep !== null)
}

/** 同端口优先 localhost；多端口时取最高端口（新 dev 在 3000 被占时常落在 3001+） */
function pickBestEndpoint(endpoints: DevEndpoint[]): DevEndpoint {
  const byPort = new Map<number, DevEndpoint>()
  for (const ep of endpoints) {
    const existing = byPort.get(ep.port)
    if (!existing || ep.host === 'localhost') byPort.set(ep.port, ep)
  }
  const ports = [...byPort.keys()].sort((a, b) => b - a)
  return byPort.get(ports[0]!)!
}

function endpointUrl(ep: DevEndpoint): string {
  return `http://${ep.host}:${ep.port}`
}

/** 开发模式：自动探测 web-tools 的 Nuxt dev（并行启动时会轮询等待） */
export async function resolveDevWebUrl(): Promise<string> {
  if (process.env.NEXUS_WEB_URL) {
    return process.env.NEXUS_WEB_URL.replace(/\/$/, '')
  }

  const maxAttempts = 60
  const intervalMs = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const endpoints = await findWebToolsEndpoints()
    if (endpoints.length > 0) {
      const best = pickBestEndpoint(endpoints)
      const maxPort = Math.max(...endpoints.map((e) => e.port))

      const onlyLowestPort =
        endpoints.length === 1 && maxPort === 3000 && attempt < PREFER_HIGHER_PORT_RECHECKS
      if (onlyLowestPort) {
        await sleep(PREFER_HIGHER_PORT_RECHECK_MS)
        continue
      }

      const url = endpointUrl(best)
      console.log(`[Nexus Tools] 使用开发服务 ${url}`)
      if (endpoints.length > 1) {
        const others = [...new Set(endpoints.map((e) => e.port))].sort().join(', ')
        console.log(
          `[Nexus Tools] 检测到多个 web-tools dev 端口: ${others}，已选用 ${best.port}（可结束旧进程: lsof -ti:3000 | xargs kill）`
        )
      }
      return url
    }

    if (attempt === 0) {
      console.log(
        '[Nexus Tools] 等待 web-tools Nuxt dev 就绪…（需另开终端执行: cd web-tools && npm run dev）'
      )
    } else if (attempt % 10 === 0) {
      console.log(
        `[Nexus Tools] 仍在等待… ${Math.round((attempt * intervalMs) / 1000)}s（最多约 ${Math.round((maxAttempts * intervalMs) / 1000)}s）`
      )
    }
    await sleep(intervalMs)
  }

  console.warn(
    '[Nexus Tools] 未探测到 web-tools dev，回退 http://localhost:3000（请先 npm run dev，或释放 3000 端口）'
  )
  return 'http://localhost:3000'
}
