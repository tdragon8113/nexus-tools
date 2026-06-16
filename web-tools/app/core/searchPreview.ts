import { evaluateArithmetic, formatCalcResult } from '~~/utils/calcExpression'
import { extractCoordinatesFromText, formatCoordinates } from '~~/utils/geoLookup'
import { extractIpFromText } from '~~/utils/ipLookup'
import {
  formatTotpCode,
  storedToTotpConfig,
  totpDisplayAccount,
  totpDisplayIssuer,
  type StoredTotpAccount,
  type TotpConfig
} from '~~/utils/totp'
import { base64ContentHintFromText, detectContentHint, type ContentHint } from './search'
import { getToolById } from './tools'

export interface TotpPreviewRow {
  account: StoredTotpAccount
  code: string
  remaining: number
}

export interface SearchPreviewLine {
  label?: string
  value: string
  mono?: boolean
  /** 点击该行时复制到剪贴板（通常为原始值，不含展示用空格） */
  copyText?: string
}

export interface SearchPreviewModel {
  title: string
  lines: SearchPreviewLine[]
  error?: string
  emptyHint?: string
  copyText?: string
}

function previewJson(raw: string): SearchPreviewModel {
  try {
    const parsed = JSON.parse(raw)
    const pretty = JSON.stringify(parsed, null, 2)
    const clipped = pretty.length > 2400 ? `${pretty.slice(0, 2400)}…` : pretty
    return {
      title: 'JSON 预览',
      lines: [{ value: clipped, mono: true }],
      copyText: pretty
    }
  } catch (e) {
    return {
      title: 'JSON 预览',
      error: e instanceof Error ? e.message : 'JSON 解析失败'
    }
  }
}

function previewBase64(raw: string): SearchPreviewModel {
  const hint = base64ContentHintFromText(raw)
  if (!hint) {
    return { title: 'Base64', emptyHint: '未识别为 Base64 内容' }
  }
  if (/^data:[^;\s]+;base64,/i.test(raw.trim())) {
    return {
      title: hint.label,
      lines: [{ value: '已识别为 Data URI，可在完整工具中查看图片预览。' }],
      copyText: raw.trim()
    }
  }
  try {
    const compact = raw.replace(/\s/g, '')
    const binary = atob(compact)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    const printable = decoded.replace(/[\x00-\x08\x0e-\x1f]/g, '')
    if (printable.trim()) {
      const clipped = printable.length > 1200 ? `${printable.slice(0, 1200)}…` : printable
      return {
        title: 'Base64 解码',
        lines: [{ value: clipped, mono: true }],
        copyText: printable
      }
    }
    return {
      title: 'Base64 解码',
      lines: [{ value: `二进制内容 · ${bytes.length} 字节` }],
      copyText: compact
    }
  } catch {
    return { title: 'Base64', error: '无法解码' }
  }
}

function previewCalculator(raw: string): SearchPreviewModel {
  const result = evaluateArithmetic(raw)
  if (!result.ok) {
    return { title: '计算器', error: result.error }
  }
  const value = formatCalcResult(result.value)
  return {
    title: '计算结果',
    lines: [{ value: `${raw.trim()} = ${value}`, mono: true }],
    copyText: value
  }
}

function previewGeo(raw: string): SearchPreviewModel {
  const coords = extractCoordinatesFromText(raw)
  if (!coords) {
    return { title: '经纬度查询', emptyHint: '未识别为经纬度坐标' }
  }
  const value = formatCoordinates(coords.lat, coords.lng)
  return {
    title: '经纬度查询',
    lines: [
      { label: '坐标', value, mono: true },
      { value: '打开工具反查该坐标对应地址。' }
    ],
    copyText: value
  }
}

function previewIp(raw: string): SearchPreviewModel {
  const ip = extractIpFromText(raw)
  if (!ip) {
    return { title: 'IP 查询', emptyHint: '未识别为 IP 地址' }
  }
  const label = ip.includes(':') ? 'IPv6' : 'IPv4'
  return {
    title: 'IP 查询',
    lines: [
      { label: '地址', value: ip, mono: true },
      { value: `识别为 ${label}，打开工具查看归属地与运营商。` }
    ],
    copyText: ip
  }
}

function previewByHint(hint: ContentHint, raw: string): SearchPreviewModel {
  switch (hint.kind) {
    case 'json':
      return previewJson(raw)
    case 'base64':
      return previewBase64(raw)
    case 'calculator':
      return previewCalculator(raw)
    case 'ip':
      return previewIp(raw)
    case 'geo':
      return previewGeo(raw)
    case 'text':
      return {
        title: '文本编辑',
        lines: [{ value: raw.length > 800 ? `${raw.slice(0, 800)}…` : raw, mono: true }],
        copyText: raw
      }
    case 'totp':
      return {
        title: '2FA / TOTP',
        emptyHint: '识别为 TOTP 链接，正在生成验证码…'
      }
    default:
      return {
        title: '预览',
        lines: [{ value: raw.length > 800 ? `${raw.slice(0, 800)}…` : raw, mono: true }],
        copyText: raw
      }
  }
}

function accountMatchesFilter(account: StoredTotpAccount, filter: string): boolean {
  const q = filter.trim().toLowerCase()
  if (!q) return true
  const config = storedToTotpConfig(account)
  const issuer = totpDisplayIssuer(config).toLowerCase()
  const name = totpDisplayAccount(config).toLowerCase()
  const label = account.label.toLowerCase()
  return issuer.includes(q) || name.includes(q) || label.includes(q)
}

/**
 * 名称框用于找工具时（如输入 2fa / totp）不应拿去筛账户；
 * 仅当输入不像「打开 2FA 工具」的检索词时，才当作账户名筛选。
 */
export function resolveTotpPreviewAccountFilter(commandFilter: string): string {
  const q = commandFilter.trim()
  if (!q) return ''

  const tool = getToolById('totp')
  if (!tool) return q

  const lower = q.toLowerCase()
  const tokens = [
    tool.id,
    tool.name,
    tool.desc,
    ...(tool.keywords ?? [])
  ].map((s) => s.toLowerCase())

  const matchesToolDiscovery = tokens.some(
    (token) => token === lower || token.includes(lower) || lower.includes(token)
  )

  return matchesToolDiscovery ? '' : q
}

/** 搜索窗：展示已配置账户与当前验证码 */
export function buildTotpAccountsSearchPreview(
  rows: TotpPreviewRow[],
  nameFilter = ''
): SearchPreviewModel {
  const filtered = rows.filter((row) => accountMatchesFilter(row.account, nameFilter))
  if (filtered.length === 0) {
    return {
      title: '2FA / TOTP',
      emptyHint: nameFilter.trim()
        ? '没有匹配的账户'
        : '尚未添加账户，按 ↵ 打开工具添加'
    }
  }

  const lines: SearchPreviewLine[] = filtered.slice(0, 12).map((row) => {
    const config = storedToTotpConfig(row.account)
    const issuer = totpDisplayIssuer(config)
    const account = totpDisplayAccount(config)
    const label = account ? `${issuer} · ${account}` : issuer
    const code = row.code ? formatTotpCode(row.code, row.account.digits) : '------'
    const copyCode = row.code?.replace(/\s/g, '') ?? ''
    return {
      label,
      value: `${code}  ·  ${row.remaining}s`,
      mono: true,
      copyText: copyCode || undefined
    }
  })

  if (filtered.length > 12) {
    lines.push({
      value: `另有 ${filtered.length - 12} 个账户，按 ↵ 打开查看全部`
    })
  }

  const firstCode = filtered[0]?.code?.replace(/\s/g, '')
  return {
    title: filtered.length === 1 ? '2FA / TOTP' : `2FA / TOTP · ${filtered.length} 个账户`,
    lines,
    copyText: firstCode || undefined
  }
}

export function buildTotpConfigSearchPreview(
  config: TotpConfig,
  code: string,
  remaining: number
): SearchPreviewModel {
  const issuer = totpDisplayIssuer(config)
  const account = totpDisplayAccount(config)
  const label = account ? `${issuer} · ${account}` : issuer
  return {
    title: '2FA / TOTP',
    lines: [
      {
        label,
        value: `${formatTotpCode(code, config.digits)}  ·  ${remaining}s`,
        mono: true,
        copyText: code.replace(/\s/g, '')
      }
    ],
    copyText: code.replace(/\s/g, '')
  }
}

export function buildToolSearchPreview(
  toolId: string,
  queryText: string,
  hint?: ContentHint | null
): SearchPreviewModel | null {
  const tool = getToolById(toolId)
  const raw = queryText.trim()
  if (!raw) {
    if (toolId === 'totp') {
      return {
        title: '2FA / TOTP',
        lines: [],
        emptyHint: '正在加载账户…'
      }
    }
    return null
  }

  const detected = hint ?? detectContentHint(raw)
  if (detected && detected.toolId === toolId) {
    return previewByHint(detected, raw)
  }

  switch (toolId) {
    case 'json':
      return previewJson(raw)
    case 'base64':
      return previewBase64(raw)
    case 'calculator':
      return previewCalculator(raw)
    case 'ip':
      return previewIp(raw)
    case 'geo':
      return previewGeo(raw)
    case 'text':
      return {
        title: '文本编辑',
        lines: [{ value: raw.length > 800 ? `${raw.slice(0, 800)}…` : raw, mono: true }],
        copyText: raw
      }
    case 'totp':
      return {
        title: '2FA / TOTP',
        emptyHint: '正在解析 TOTP 内容…'
      }
    default:
      if (detected) return previewByHint(detected, raw)
      return {
        title: tool?.name ?? '预览',
        lines: [{ value: raw.length > 800 ? `${raw.slice(0, 800)}…` : raw, mono: true }],
        copyText: raw
      }
  }
}

export function buildMacAppSearchPreview(appName: string, appPath: string): SearchPreviewModel {
  return {
    title: appName,
    lines: [{ label: '路径', value: appPath, mono: true }]
  }
}
