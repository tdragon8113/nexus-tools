import { continentCodeFromCountry } from './countryContinent'

export type IpVersion = 'IPv4' | 'IPv6'

export interface IpLookupInfo {
  ip: string
  version: IpVersion
  continent: string
  country: string
  countryCode: string
  region: string
  city: string
  postal: string
  latitude: number | null
  longitude: number | null
  isp: string
  org: string
  asn: number | null
  timezone: string
  timezoneUtc: string
  flagEmoji: string
}

export type IpLookupResult =
  | { ok: true; data: IpLookupInfo }
  | { ok: false; error: string }

export type IpLookupOptions = {
  /** 仅本机 IP 查询（未指定 IP）时生效 */
  useSystemProxy?: boolean
}

type IpNetworkFetch = (url: string) => Promise<Response>

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/

const IPV6_RE =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/

const CONTINENT_NAMES: Record<string, string> = {
  AF: '非洲',
  AN: '南极洲',
  AS: '亚洲',
  EU: '欧洲',
  NA: '北美洲',
  OC: '大洋洲',
  SA: '南美洲'
}

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NexusTools/1.0 (+https://github.com/tdragon8113/nexus-tools)'
} as const

export function isIpv4(value: string): boolean {
  return IPV4_RE.test(value.trim())
}

export function isIpv6(value: string): boolean {
  return IPV6_RE.test(value.trim())
}

export function isIpAddress(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  return isIpv4(t) || isIpv6(t)
}

/** 从粘贴文本中提取首个 IP（支持 [IPv6] 包裹） */
export function extractIpFromText(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const bracket = trimmed.match(/\[([0-9a-fA-F:]+)\]/)
  if (bracket?.[1] && isIpv6(bracket[1])) return bracket[1]

  const token = trimmed.split(/\s+/)[0]?.replace(/[,;，；]+$/, '') ?? ''
  if (isIpAddress(token)) return token

  const ipv4 = trimmed.match(
    /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/
  )
  if (ipv4?.[0]) return ipv4[0]

  return null
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function ipVersion(ip: string): IpVersion {
  return ip.includes(':') ? 'IPv6' : 'IPv4'
}

function continentName(code: string): string {
  return CONTINENT_NAMES[code.toUpperCase()] ?? ''
}

function parseOrgField(org: string): { asn: number | null; org: string } {
  const match = org.match(/^AS(\d+)\s*(.*)$/i)
  if (!match) return { asn: null, org }
  return {
    asn: Number(match[1]),
    org: match[2]?.trim() || org
  }
}

function buildInfo(partial: Omit<IpLookupInfo, 'version'> & { ip: string }): IpLookupInfo {
  const continent =
    partial.continent ||
    continentName(continentCodeFromCountry(partial.countryCode))

  return {
    ...partial,
    continent,
    version: ipVersion(partial.ip)
  }
}

async function readJsonResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

type IpInfoResponse = {
  ip?: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  postal?: string
  timezone?: string
  error?: { title?: string; message?: string }
  bogon?: boolean
}

function createProviders(fetchImpl: IpNetworkFetch) {
  async function fetchFromIpInfo(ip?: string): Promise<IpLookupResult> {
  const url = ip ? `https://ipinfo.io/${encodeURIComponent(ip)}/json` : 'https://ipinfo.io/json'
  const payload = (await readJsonResponse(
    await fetchImpl(url)
  )) as IpInfoResponse

  if (payload.bogon) {
    return { ok: false, error: '该地址为保留或本地地址，无法查询归属地' }
  }
  if (payload.error?.message || payload.error?.title) {
    return { ok: false, error: payload.error.message || payload.error.title || '查询失败' }
  }

  const resolvedIp = asText(payload.ip) || ip?.trim()
  if (!resolvedIp) return { ok: false, error: '响应缺少 IP 地址' }

  const [latRaw, lonRaw] = (payload.loc ?? '').split(',')
  const orgField = parseOrgField(asText(payload.org))

  return {
    ok: true,
    data: buildInfo({
      ip: resolvedIp,
      continent: '',
      country: asText(payload.country),
      countryCode: asText(payload.country),
      region: asText(payload.region),
      city: asText(payload.city),
      postal: asText(payload.postal),
      latitude: asNumber(latRaw),
      longitude: asNumber(lonRaw),
      isp: orgField.org,
      org: orgField.org,
      asn: orgField.asn,
      timezone: asText(payload.timezone),
      timezoneUtc: '',
      flagEmoji: ''
    })
  }
  }

type GeoJsResponse = {
  ip?: string
  continent_code?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  latitude?: string | number
  longitude?: string | number
  organization?: string
  organization_name?: string
  asn?: number
  timezone?: string
  error?: string
}

  async function fetchFromGeoJs(ip?: string): Promise<IpLookupResult> {
  const url = ip
    ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`
    : 'https://get.geojs.io/v1/ip/geo.json'
  const payload = (await readJsonResponse(
    await fetchImpl(url)
  )) as GeoJsResponse

  if (payload.error) {
    return { ok: false, error: payload.error }
  }

  const resolvedIp = asText(payload.ip) || ip?.trim()
  if (!resolvedIp) return { ok: false, error: '响应缺少 IP 地址' }

  const orgField = parseOrgField(asText(payload.organization))
  const orgName = asText(payload.organization_name) || orgField.org

  return {
    ok: true,
    data: buildInfo({
      ip: resolvedIp,
      continent: continentName(asText(payload.continent_code)),
      country: asText(payload.country),
      countryCode: asText(payload.country_code),
      region: asText(payload.region),
      city: asText(payload.city),
      postal: '',
      latitude: asNumber(payload.latitude),
      longitude: asNumber(payload.longitude),
      isp: orgName,
      org: orgName,
      asn: asNumber(payload.asn) ?? orgField.asn,
      timezone: asText(payload.timezone),
      timezoneUtc: '',
      flagEmoji: ''
    })
  }
  }

type IpSbResponse = {
  ip?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  isp?: string
  organization?: string
  asn_organization?: string
  asn?: number
  latitude?: number
  longitude?: number
  timezone?: string
}

  async function fetchFromIpSb(ip?: string): Promise<IpLookupResult> {
  const url = ip ? `https://api.ip.sb/geoip/${encodeURIComponent(ip)}` : 'https://api.ip.sb/geoip'
  const payload = (await readJsonResponse(
    await fetchImpl(url)
  )) as IpSbResponse

  const resolvedIp = asText(payload.ip) || ip?.trim()
  if (!resolvedIp) return { ok: false, error: '响应缺少 IP 地址' }

  const org = asText(payload.asn_organization) || asText(payload.organization)

  return {
    ok: true,
    data: buildInfo({
      ip: resolvedIp,
      continent: '',
      country: asText(payload.country),
      countryCode: asText(payload.country_code),
      region: asText(payload.region),
      city: asText(payload.city),
      postal: '',
      latitude: asNumber(payload.latitude),
      longitude: asNumber(payload.longitude),
      isp: asText(payload.isp) || org,
      org,
      asn: asNumber(payload.asn),
      timezone: asText(payload.timezone),
      timezoneUtc: '',
      flagEmoji: ''
    })
  }
  }

  return [fetchFromIpInfo, fetchFromGeoJs, fetchFromIpSb] as const
}

const defaultFetchImpl: IpNetworkFetch = (url) => fetch(url, { headers: FETCH_HEADERS })

/** 直接走网络请求（主进程或浏览器） */
export async function fetchIpLookupNetwork(
  ip?: string,
  options?: { fetchImpl?: IpNetworkFetch }
): Promise<IpLookupResult> {
  const target = ip?.trim()
  if (target && !isIpAddress(target)) {
    return { ok: false, error: '请输入有效的 IPv4 或 IPv6 地址' }
  }

  const fetchImpl = options?.fetchImpl ?? defaultFetchImpl
  const providers = createProviders(fetchImpl)
  const errors: string[] = []

  for (const provider of providers) {
    try {
      const result = await provider(target)
      if (result.ok) return result
      if (result.error) errors.push(result.error)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : '网络请求失败')
    }
  }

  const last = errors.at(-1)
  return { ok: false, error: last || '所有查询服务均不可用，请稍后重试' }
}

function canUseDesktopBridge(): boolean {
  return typeof window !== 'undefined' && typeof window.nexusDesktop?.lookupIp === 'function'
}

function isLocalIpLookup(ip?: string): boolean {
  return !ip?.trim()
}

export async function fetchIpLookup(ip?: string, options?: IpLookupOptions): Promise<IpLookupResult> {
  if (canUseDesktopBridge()) {
    try {
      const request = {
        ip,
        ...(isLocalIpLookup(ip) ? { useSystemProxy: options?.useSystemProxy === true } : {})
      }
      return await window.nexusDesktop!.lookupIp!(request)
    } catch {
      return fetchIpLookupNetwork(ip)
    }
  }
  return fetchIpLookupNetwork(ip)
}

export function formatIpLookupSummary(data: IpLookupInfo): string {
  const location = [data.country, data.region, data.city].filter(Boolean).join(' · ')
  const isp = data.isp || data.org
  const parts = [data.ip, location, isp].filter(Boolean)
  return parts.join(' — ')
}
