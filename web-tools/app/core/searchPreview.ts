import { evaluateArithmetic, formatCalcResult } from '~~/utils/calcExpression'
import { parseTimestampFlexible } from '~~/utils/timestampParse'
import { base64ContentHintFromText, detectContentHint, type ContentHint } from './search'
import { getToolById } from './tools'

export interface SearchPreviewLine {
  label?: string
  value: string
  mono?: boolean
}

export interface SearchPreviewModel {
  title: string
  lines: SearchPreviewLine[]
  error?: string
  emptyHint?: string
  copyText?: string
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function formatTimestamp(ms: number): SearchPreviewLine[] {
  const date = new Date(ms)
  return [
    { label: '毫秒', value: String(ms), mono: true },
    { label: '秒', value: String(Math.floor(ms / 1000)), mono: true },
    { label: '本地时间', value: date.toLocaleString(), mono: true },
    { label: 'ISO', value: date.toISOString(), mono: true }
  ]
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

function previewUrl(raw: string): SearchPreviewModel {
  try {
    const url = new URL(raw.trim())
    return {
      title: 'URL 解析',
      lines: [
        { label: '协议', value: url.protocol, mono: true },
        { label: '主机', value: url.host, mono: true },
        { label: '路径', value: url.pathname + url.search + url.hash, mono: true }
      ],
      copyText: url.toString()
    }
  } catch {
    return { title: 'URL 解析', error: '无效的 URL' }
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

function previewTimestamp(raw: string): SearchPreviewModel {
  const parsed = parseTimestampFlexible(raw)
  if (!parsed.ok) {
    return { title: '时间戳', error: parsed.error }
  }
  return {
    title: '时间戳转换',
    lines: formatTimestamp(parsed.ms),
    copyText: String(parsed.ms)
  }
}

function previewByHint(hint: ContentHint, raw: string): SearchPreviewModel {
  switch (hint.kind) {
    case 'json':
      return previewJson(raw)
    case 'base64':
      return previewBase64(raw)
    case 'url':
      return previewUrl(raw)
    case 'calculator':
      return previewCalculator(raw)
    case 'timestamp':
      return previewTimestamp(raw)
    case 'uuid':
      if (UUID_RE.test(raw.trim())) {
        return {
          title: 'UUID',
          lines: [{ value: raw.trim().toLowerCase(), mono: true }],
          copyText: raw.trim().toLowerCase()
        }
      }
      return { title: 'UUID', error: '格式无效' }
    case 'hash':
      return {
        title: '哈希值',
        lines: [{ value: raw.trim(), mono: true }],
        copyText: raw.trim()
      }
    case 'totp':
      return {
        title: '2FA / TOTP',
        lines: [{ value: '请在完整工具中查看动态验证码。' }],
        emptyHint: '识别为 TOTP 链接'
      }
    case 'text':
    default:
      return previewPlainText(raw)
  }
}

function previewPlainText(raw: string): SearchPreviewModel {
  const t = raw.trim()
  if (!t) {
    return { title: '文本', emptyHint: '在 Query 中粘贴或输入内容' }
  }
  const clipped = t.length > 1200 ? `${t.slice(0, 1200)}…` : t
  return {
    title: '文本预览',
    lines: [{ value: clipped, mono: true }],
    copyText: t
  }
}

export function buildToolSearchPreview(
  toolId: string,
  queryText: string,
  hint?: ContentHint | null
): SearchPreviewModel {
  const tool = getToolById(toolId)
  const raw = queryText.trim()
  if (!raw) {
    return {
      title: tool?.name ?? '预览',
      emptyHint: '在 Query 中粘贴或输入内容，将自动匹配工具并预览'
    }
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
    case 'url':
      return previewUrl(raw)
    case 'calculator':
      return previewCalculator(raw)
    case 'timestamp':
      return previewTimestamp(raw)
    case 'uuid':
      return previewByHint({ kind: 'uuid', toolId: 'uuid', label: 'UUID' }, raw)
    case 'hash':
      return previewByHint({ kind: 'hash', toolId: 'hash', label: '哈希' }, raw)
    case 'text':
      return previewPlainText(raw)
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
    lines: [{ label: '路径', value: appPath, mono: true }],
    emptyHint: '按 ↵ 打开应用'
  }
}
