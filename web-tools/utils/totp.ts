export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512'

export interface TotpConfig {
  secret: Uint8Array
  label: string
  issuer?: string
  digits: number
  period: number
  algorithm: TotpAlgorithm
}

export interface TotpParseResult {
  ok: true
  config: TotpConfig
}

export interface TotpParseError {
  ok: false
  error: string
}

export type TotpInputParseResult = TotpParseResult | TotpParseError

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const ALGO_MAP: Record<TotpAlgorithm, AlgorithmIdentifier> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512'
}

function normalizeAlgorithm(raw: string | null): TotpAlgorithm {
  const value = (raw ?? 'SHA1').replace(/-/g, '').toUpperCase()
  if (value === 'SHA256') return 'SHA256'
  if (value === 'SHA512') return 'SHA512'
  return 'SHA1'
}

export function decodeBase32(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/g, '').replace(/\s/g, '').toUpperCase()
  if (!cleaned) throw new Error('密钥为空')

  let bits = 0
  let value = 0
  const output: number[] = []

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error('密钥包含非法字符')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  if (output.length === 0) throw new Error('密钥无效')
  return Uint8Array.from(output)
}

export function encodeBase32(bytes: Uint8Array): string {
  if (bytes.length === 0) return ''

  let bits = 0
  let value = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  return output
}

export interface StoredTotpAccount {
  id: string
  label: string
  issuer?: string
  secretBase32: string
  digits: number
  period: number
  algorithm: TotpAlgorithm
}

export function totpConfigToStored(config: TotpConfig, id?: string): StoredTotpAccount {
  return {
    id: id ?? (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `totp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    label: config.label,
    issuer: config.issuer,
    secretBase32: encodeBase32(config.secret),
    digits: config.digits,
    period: config.period,
    algorithm: config.algorithm
  }
}

export function storedToTotpConfig(stored: StoredTotpAccount): TotpConfig {
  return {
    secret: decodeBase32(stored.secretBase32),
    label: stored.label,
    issuer: stored.issuer,
    digits: stored.digits,
    period: stored.period,
    algorithm: stored.algorithm
  }
}

export function totpSecretFingerprint(config: TotpConfig): string {
  return encodeBase32(config.secret)
}

function buildOtpAuthQuery(stored: StoredTotpAccount): string {
  const parts = [`secret=${stored.secretBase32}`]
  if (stored.issuer) parts.push(`issuer=${stored.issuer}`)
  if (stored.digits !== 6) parts.push(`digits=${String(stored.digits)}`)
  if (stored.period !== 30) parts.push(`period=${String(stored.period)}`)
  if (stored.algorithm !== 'SHA1') parts.push(`algorithm=${stored.algorithm}`)
  return parts.join('&')
}

/** 生成可读的 otpauth 链接（保留 :、@、中文等，不做 %3A 这类编码） */
export function buildOtpAuthUrl(stored: StoredTotpAccount): string {
  const pathLabel = stored.issuer
    ? `${stored.issuer}:${stored.label}`
    : stored.label
  return `otpauth://totp/${pathLabel}?${buildOtpAuthQuery(stored)}`
}

export function applyTotpDisplayNames(
  config: TotpConfig,
  names: { issuer?: string; label?: string }
): TotpConfig {
  const issuer = names.issuer?.trim() || undefined
  const label = names.label?.trim() || issuer || config.label || 'TOTP'
  return { ...config, issuer, label }
}

export function formatTotpCode(code: string, digits = 6): string {
  if (!code) return '------'
  const mid = Math.floor(digits / 2)
  return `${code.slice(0, mid)} ${code.slice(mid)}`
}

function simplifyPathLabel(pathLabel: string, issuer: string): string {
  let rest = pathLabel.trim()
  const lowerIssuer = issuer.toLowerCase()
  while (rest.toLowerCase().startsWith(`${lowerIssuer}:`)) {
    rest = rest.slice(issuer.length + 1).trim()
  }
  if (!rest || rest === issuer) return issuer

  const segments = rest.split(':').map((part) => part.trim()).filter(Boolean)
  if (segments.length === 0) return pathLabel.trim() || issuer

  const last = segments[segments.length - 1]!
  if (last.includes('@') || segments.length > 1) return last
  return rest
}

function parseLabel(pathLabel: string, issuerParam: string | null): { label: string; issuer?: string } {
  const decoded = decodeURIComponent(pathLabel || 'TOTP').trim() || 'TOTP'
  const issuer = issuerParam?.trim() || undefined

  if (issuer) {
    return { label: simplifyPathLabel(decoded, issuer), issuer }
  }

  const colon = decoded.indexOf(':')
  if (colon > 0) {
    return {
      issuer: decoded.slice(0, colon).trim(),
      label: decoded.slice(colon + 1).trim() || decoded
    }
  }

  return { label: decoded }
}

export function parseOtpAuthUrl(raw: string): TotpConfig | null {
  const trimmed = raw.trim()
  if (!trimmed.toLowerCase().startsWith('otpauth://')) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'otpauth:') return null
  if (url.hostname !== 'totp') return null

  const secretRaw = url.searchParams.get('secret')?.replace(/\s/g, '')
  if (!secretRaw) return null

  let secret: Uint8Array
  try {
    secret = decodeBase32(secretRaw)
  } catch {
    return null
  }

  const { label, issuer } = parseLabel(url.pathname.slice(1), url.searchParams.get('issuer'))
  const digitsRaw = Number.parseInt(url.searchParams.get('digits') ?? '6', 10)
  const periodRaw = Number.parseInt(url.searchParams.get('period') ?? '30', 10)
  const digits = Number.isFinite(digitsRaw) && digitsRaw >= 6 && digitsRaw <= 10 ? digitsRaw : 6
  const period = Number.isFinite(periodRaw) && periodRaw > 0 ? periodRaw : 30

  return {
    secret,
    label,
    issuer,
    digits,
    period,
    algorithm: normalizeAlgorithm(url.searchParams.get('algorithm'))
  }
}

export function parseTotpInput(raw: string): TotpInputParseResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: '请输入 otpauth 链接或 Base32 密钥' }
  }

  if (trimmed.toLowerCase().startsWith('otpauth://')) {
    const config = parseOtpAuthUrl(trimmed)
    if (!config) return { ok: false, error: '无法解析 otpauth 链接，请检查 secret 等参数' }
    return { ok: true, config }
  }

  try {
    const secret = decodeBase32(trimmed)
    return {
      ok: true,
      config: {
        secret,
        label: 'TOTP',
        digits: 6,
        period: 30,
        algorithm: 'SHA1'
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '无法识别的输入格式'
    }
  }
}

function counterToBytes(counter: number): Uint8Array {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  const high = Math.floor(counter / 0x1_0000_0000)
  const low = counter >>> 0
  view.setUint32(0, high, false)
  view.setUint32(4, low, false)
  return new Uint8Array(buf)
}

async function hmacDigest(
  algorithm: TotpAlgorithm,
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const subtle = typeof crypto !== 'undefined' && crypto.subtle
  if (!subtle) throw new Error('当前环境不支持 Web Crypto')

  const cryptoKey = await subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: ALGO_MAP[algorithm] },
    false,
    ['sign']
  )
  const signed = await subtle.sign('HMAC', cryptoKey, data)
  return new Uint8Array(signed)
}

async function hotp(
  secret: Uint8Array,
  counter: number,
  digits: number,
  algorithm: TotpAlgorithm
): Promise<string> {
  const digest = await hmacDigest(algorithm, secret, counterToBytes(counter))
  const offset = digest[digest.length - 1]! & 0x0f
  const bin =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff)
  const mod = 10 ** digits
  return String(bin % mod).padStart(digits, '0')
}

export function totpCounter(nowMs = Date.now(), period = 30): number {
  return Math.floor(nowMs / 1000 / period)
}

export function totpRemainingSeconds(period = 30, nowMs = Date.now()): number {
  const elapsed = Math.floor(nowMs / 1000) % period
  return period - elapsed
}

export async function generateTotp(config: TotpConfig, nowMs = Date.now()): Promise<string> {
  const counter = totpCounter(nowMs, config.period)
  return hotp(config.secret, counter, config.digits, config.algorithm)
}

export function formatTotpAccount(config: TotpConfig): string {
  if (config.issuer) return `${config.issuer} · ${config.label}`
  return config.label
}

export function totpDisplayName(config: Pick<TotpConfig, 'issuer' | 'label'>): string {
  return formatTotpAccount({
    ...config,
    secret: new Uint8Array(0),
    digits: 6,
    period: 30,
    algorithm: 'SHA1'
  })
}

export function totpDisplayIssuer(config: Pick<TotpConfig, 'issuer' | 'label'>): string {
  return config.issuer?.trim() || config.label.trim() || 'TOTP'
}

export function totpDisplayAccount(config: Pick<TotpConfig, 'issuer' | 'label'>): string {
  const issuer = config.issuer?.trim()
  const label = config.label.trim()
  if (!issuer) return ''
  if (!label || label === issuer) return ''
  return label
}

const AVATAR_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6'
] as const

export function totpAvatarInitial(config: Pick<TotpConfig, 'issuer' | 'label'>): string {
  const source = totpDisplayIssuer(config)
  const match = source.match(/[A-Za-z0-9\u4e00-\u9fff]/)
  return (match?.[0] ?? '?').toUpperCase()
}

export function totpAvatarColor(config: Pick<TotpConfig, 'issuer' | 'label'>): string {
  const key = `${config.issuer ?? ''}:${config.label}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!
}

export function totpTimerDashOffset(remaining: number, period: number, radius = 15.5): number {
  if (period <= 0) return 0
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(1, remaining / period))
  return circumference * (1 - progress)
}

export const TOTP_TIMER_RADIUS = 15.5
export const TOTP_TIMER_CIRCUMFERENCE = 2 * Math.PI * TOTP_TIMER_RADIUS
