import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { net, session } from 'electron'
import { fetchIpLookupNetwork, type IpLookupResult } from '../../utils/ipLookup'

const execFileAsync = promisify(execFile)

const PROBE_URL = 'https://ipinfo.io/json'
const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NexusTools/1.0 (+https://github.com/tdragon8113/nexus-tools)'
} as const

export type SystemProxyStatus = {
  enabled: boolean
  summary: string
}

export type IpLookupRequest = {
  ip?: string
  /** 仅本机 IP 查询时生效 */
  useSystemProxy?: boolean
}

let systemProxySession: Electron.Session | null = null
let systemProxySessionReady: Promise<Electron.Session> | null = null

function formatProxySummary(resolved: string): string {
  const rules = resolved
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  const proxies = rules.filter((part) => !/^DIRECT/i.test(part))
  return proxies.join(' · ') || resolved.trim()
}

async function getSystemProxySession(): Promise<Electron.Session> {
  if (systemProxySession) return systemProxySession
  if (!systemProxySessionReady) {
    systemProxySessionReady = (async () => {
      const created = session.fromPartition('persist:nexus-ip-system', { cache: false })
      await created.setProxy({ mode: 'system' })
      await created.closeAllConnections()
      systemProxySession = created
      return created
    })()
  }
  return systemProxySessionReady
}

/** 主进程 Node fetch：不读取 macOS 系统 HTTP/SOCKS 代理 */
function nodeDirectFetch(url: string): Promise<Response> {
  return fetch(url, { headers: FETCH_HEADERS })
}

async function readMacSystemProxy(): Promise<SystemProxyStatus> {
  if (process.platform !== 'darwin') {
    return { enabled: false, summary: '' }
  }

  try {
    const { stdout } = await execFileAsync('scutil', ['--proxy'], { timeout: 3000 })
    const text = stdout
    const readFlag = (key: string) => new RegExp(`${key}\\s*:\\s*1\\b`).test(text)
    const readValue = (key: string) => {
      const match = text.match(new RegExp(`${key}\\s*:\\s*([^\\n]+)`))
      return match?.[1]?.trim() ?? ''
    }

    const httpEnabled = readFlag('HTTPEnable')
    const httpsEnabled = readFlag('HTTPSEnable')
    const socksEnabled = readFlag('SOCKSEnable')
    const pacEnabled = readFlag('ProxyAutoConfigEnable')
    const enabled = httpEnabled || httpsEnabled || socksEnabled || pacEnabled
    if (!enabled) return { enabled: false, summary: '' }

    const parts: string[] = []
    if (pacEnabled) {
      const pacUrl = readValue('ProxyAutoConfigURLString')
      parts.push(pacUrl ? `PAC ${pacUrl}` : 'PAC')
    }
    if (httpsEnabled) {
      const host = readValue('HTTPSProxy')
      const port = readValue('HTTPSPort')
      if (host) parts.push(`HTTPS ${host}${port ? `:${port}` : ''}`)
    } else if (httpEnabled) {
      const host = readValue('HTTPProxy')
      const port = readValue('HTTPPort')
      if (host) parts.push(`HTTP ${host}${port ? `:${port}` : ''}`)
    }
    if (socksEnabled) {
      const host = readValue('SOCKSProxy')
      const port = readValue('SOCKSPort')
      if (host) parts.push(`SOCKS ${host}${port ? `:${port}` : ''}`)
    }

    return {
      enabled: true,
      summary: parts.join(' · ') || '系统代理已开启'
    }
  } catch {
    return { enabled: false, summary: '' }
  }
}

export async function getSystemProxyStatus(): Promise<SystemProxyStatus> {
  const [resolved, macProxy] = await Promise.all([
    session.defaultSession.resolveProxy(PROBE_URL),
    readMacSystemProxy()
  ])

  const trimmed = resolved.trim()
  const resolveEnabled = trimmed.length > 0 && !/^DIRECT/i.test(trimmed)
  const enabled = resolveEnabled || macProxy.enabled

  if (!enabled) {
    return { enabled: false, summary: '' }
  }

  const summary = resolveEnabled
    ? formatProxySummary(resolved)
    : macProxy.summary

  return { enabled: true, summary }
}

function createNetFetch(useSystemProxy: boolean): (url: string) => Promise<Response> {
  if (!useSystemProxy) {
    return nodeDirectFetch
  }

  return async (url: string) => {
    const sess = await getSystemProxySession()
    return net.fetch(url, {
      headers: FETCH_HEADERS,
      session: sess
    })
  }
}

export async function fetchIpLookupWithOptions(request: IpLookupRequest = {}): Promise<IpLookupResult> {
  const target = request.ip?.trim()
  const isLocalLookup = !target
  const useSystemProxy = isLocalLookup && request.useSystemProxy === true
  return fetchIpLookupNetwork(target, {
    fetchImpl: createNetFetch(isLocalLookup ? useSystemProxy : false)
  })
}
