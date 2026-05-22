import http from 'node:http'

/** Nuxt dev 在 macOS 上常只监听 [::1]，必须用 localhost 而非 127.0.0.1 */
const DEV_HOSTS = ['localhost', '127.0.0.1'] as const
const DEV_PORTS = [3000, 3001, 3002, 3003]

function probe(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/`, (res) => {
      res.resume()
      resolve(res.statusCode !== undefined && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(800, () => {
      req.destroy()
      resolve(false)
    })
  })
}

/** 开发模式：自动探测 Nuxt dev 地址 */
export async function resolveDevWebUrl(): Promise<string> {
  if (process.env.NEXUS_WEB_URL) {
    return process.env.NEXUS_WEB_URL.replace(/\/$/, '')
  }

  for (const port of DEV_PORTS) {
    for (const host of DEV_HOSTS) {
      if (await probe(host, port)) {
        const url = `http://${host}:${port}`
        console.log(`[Nexus Tools] 使用开发服务 ${url}`)
        return url
      }
    }
  }

  console.warn('[Nexus Tools] 未探测到 Nuxt dev，回退 http://localhost:3000（请先 npm run dev）')
  return 'http://localhost:3000'
}
