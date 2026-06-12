export interface GeoLookupInfo {
  latitude: number
  longitude: number
  name: string
  country: string
  countryCode: string
  region: string
  city: string
  timezone: string
  elevation: number | null
  displayName: string
}

export type GeoLookupResult =
  | { ok: true; data: GeoLookupInfo }
  | { ok: false; error: string }

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NexusTools/1.0 (+https://github.com/tdragon8113/nexus-tools)'
} as const

const PROVIDER_TIMEOUT_MS = 6_000
const LOOKUP_TOTAL_TIMEOUT_MS = 12_000

async function fetchWithTimeout(url: string, timeoutMs = PROVIDER_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal })
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('请求超时')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

function roundCoord(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function tryParsePair(latRaw: string, lngRaw: string): { lat: number; lng: number } | null {
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

export function extractCoordinatesFromText(raw: string): { lat: number; lng: number } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const comma = trimmed.match(/(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)/)
  if (comma) return tryParsePair(comma[1], comma[2])

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? trimmed
  const space = firstLine.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/)
  if (space) return tryParsePair(space[1], space[2])

  return null
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat}, ${lng}`
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

async function readJsonResponse(res: Response): Promise<unknown> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

type OpenMeteoReverseResult = {
  name?: string
  latitude?: number
  longitude?: number
  elevation?: number
  country?: string
  country_code?: string
  admin1?: string
  timezone?: string
}

type OpenMeteoReverseResponse = {
  results?: OpenMeteoReverseResult[]
}

type BigDataCloudResponse = {
  latitude?: number
  longitude?: number
  countryName?: string
  countryCode?: string
  principalSubdivision?: string
  city?: string
  locality?: string
  localityInfo?: {
    administrative?: Array<{ name?: string; order?: number }>
  }
}

function buildInfo(
  lat: number,
  lng: number,
  partial: Omit<GeoLookupInfo, 'latitude' | 'longitude'>
): GeoLookupInfo {
  return {
    latitude: lat,
    longitude: lng,
    ...partial
  }
}

async function fetchFromOpenMeteo(lat: number, lng: number): Promise<GeoLookupResult> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse')
  url.searchParams.set('latitude', String(roundCoord(lat)))
  url.searchParams.set('longitude', String(roundCoord(lng)))
  url.searchParams.set('language', 'zh')

  const payload = (await readJsonResponse(
    await fetchWithTimeout(url.toString())
  )) as OpenMeteoReverseResponse

  const hit = payload.results?.[0]
  if (!hit) return { ok: false, error: '未找到该坐标对应的位置' }

  const name = asText(hit.name)
  const country = asText(hit.country)
  const region = asText(hit.admin1)

  return {
    ok: true,
    data: buildInfo(lat, lng, {
      name,
      country,
      countryCode: asText(hit.country_code).toUpperCase(),
      region,
      city: name || region,
      timezone: asText(hit.timezone),
      elevation: asNumber(hit.elevation),
      displayName: [name, region, country].filter(Boolean).join(' · ') || formatCoordinates(lat, lng)
    })
  }
}

async function fetchFromBigDataCloud(lat: number, lng: number): Promise<GeoLookupResult> {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(roundCoord(lat)))
  url.searchParams.set('longitude', String(roundCoord(lng)))
  url.searchParams.set('localityLanguage', 'zh')

  const payload = (await readJsonResponse(
    await fetchWithTimeout(url.toString())
  )) as BigDataCloudResponse

  const country = asText(payload.countryName)
  const region = asText(payload.principalSubdivision)
  const city = asText(payload.city) || asText(payload.locality) || region
  const adminNames =
    payload.localityInfo?.administrative
      ?.map((item) => asText(item.name))
      .filter(Boolean) ?? []
  const displayName = [...new Set([city, region, country, ...adminNames])]
    .filter(Boolean)
    .join(' · ')

  if (!country && !city && !displayName) {
    return { ok: false, error: '未找到该坐标对应的位置' }
  }

  return {
    ok: true,
    data: buildInfo(lat, lng, {
      name: city,
      country,
      countryCode: asText(payload.countryCode).toUpperCase(),
      region,
      city,
      timezone: '',
      elevation: null,
      displayName: displayName || formatCoordinates(lat, lng)
    })
  }
}

async function fetchGeoLookupInternal(coords: { lat: number; lng: number }): Promise<GeoLookupResult> {
  const providers = [fetchFromOpenMeteo, fetchFromBigDataCloud]
  const errors: string[] = []

  for (const provider of providers) {
    try {
      const result = await provider(coords.lat, coords.lng)
      if (result.ok) return result
      if (result.error) errors.push(result.error)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : '网络请求失败')
    }
  }

  return { ok: false, error: errors.at(-1) || '无法获取该坐标的地址，请稍后重试' }
}

export async function fetchGeoLookup(input?: string): Promise<GeoLookupResult> {
  const coords = extractCoordinatesFromText(input ?? '')
  if (!coords) {
    return { ok: false, error: '请输入有效的经纬度，如 31.2222, 121.4581' }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      fetchGeoLookupInternal(coords),
      new Promise<GeoLookupResult>((resolve) => {
        timer = setTimeout(
          () => resolve({ ok: false, error: '查询超时，请检查网络后重试' }),
          LOOKUP_TOTAL_TIMEOUT_MS
        )
      })
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function formatGeoLookupSummary(data: GeoLookupInfo): string {
  const location = [data.country, data.region, data.city].filter(Boolean).join(' · ')
  const coords = formatCoordinates(data.latitude, data.longitude)
  return [coords, location || data.displayName].filter(Boolean).join(' — ')
}

export function openStreetMapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`
}
