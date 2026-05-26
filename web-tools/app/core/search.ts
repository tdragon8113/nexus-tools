import { MAX_CLIPBOARD_TEXT_CHARS, stripWrappingDoubleQuotes } from '~~/utils/utf8Base64'
import { getToolPinyinAliases } from './pinyin'
import { siteTools, type SiteTool } from './tools'

export type ContentHintKind =
  | 'json'
  | 'url'
  | 'timestamp'
  | 'uuid'
  | 'base64'
  | 'hash'
  | 'calculator'
  | 'text'

export interface ContentHint {
  kind: ContentHintKind
  toolId: string
  label: string
}

/** 无内容类型、无工具名匹配时的默认兜底 */
export const TEXT_FALLBACK_HINT: ContentHint = {
  kind: 'text',
  toolId: 'text',
  label: '文本编辑'
}

export interface ScoredTool {
  tool: SiteTool
  score: number
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MD5_RE = /^[a-f0-9]{32}$/i
const SHA256_RE = /^[a-f0-9]{64}$/i
const BASE64_RE = /^[A-Za-z0-9+/]+=*$/
const DATA_URI_BASE64_RE = /^data:[^;\s]+;base64,/i

/** 从 Data URI 中取出逗号后的 Base64 载荷 */
function extractDataUriBase64Payload(raw: string): string | null {
  const t = stripWrappingDoubleQuotes(raw)
  if (!DATA_URI_BASE64_RE.test(t)) return null
  const idx = t.toLowerCase().indexOf(';base64,')
  if (idx === -1) return null
  return t.slice(idx + ';base64,'.length)
}

function looksLikeRawBase64(payload: string): boolean {
  const p = payload.replace(/\s/g, '')
  if (p.length < 8 || !/[+/=]/.test(p)) return false
  return BASE64_RE.test(p)
}

/** 剪贴板被截断或缺 padding 时，用采样判断是否为 Base64 / Data URI */
function looksLikeProbableBase64Payload(text: string): boolean {
  const unquoted = stripWrappingDoubleQuotes(text).trim()
  if (/^data:[^;\s]+;base64,/i.test(unquoted)) return true
  const compact = unquoted.replace(/\s/g, '')
  if (compact.length < 64) return false
  const head = compact.slice(0, 4096)
  const tail = compact.slice(-512)
  const sample = head + tail
  const ok = sample.match(/[A-Za-z0-9+/=]/g)?.length ?? 0
  return ok / sample.length >= 0.92 && /[+/=]/.test(sample)
}

/** 长文/剪贴板只用首行取样做工具名匹配，避免正文每个词都去撞关键词 */
const TOOL_KEYWORD_PROBE_MAX = 120

function tokenizeQuery(q: string): string[] {
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const compact = q.toLowerCase().replace(/\s+/g, '')
  if (compact.length >= 2 && !tokens.includes(compact)) {
    tokens.push(compact)
  }
  const compactUnquoted = stripWrappingDoubleQuotes(q).toLowerCase().replace(/\s+/g, '')
  if (
    compactUnquoted.length >= 2 &&
    compactUnquoted !== compact &&
    !tokens.includes(compactUnquoted)
  ) {
    tokens.push(compactUnquoted)
  }
  return tokens
}

function queryTokensForToolSearch(q: string): string[] {
  const trimmed = q.trim()
  if (!trimmed) return []
  const singleLine = !trimmed.includes('\n') && !trimmed.includes('\r')
  if (singleLine && trimmed.length <= TOOL_KEYWORD_PROBE_MAX) {
    return tokenizeQuery(trimmed)
  }
  const firstLine = trimmed.split(/\r?\n/).find((l) => l.trim())?.trim() ?? trimmed
  return tokenizeQuery(firstLine.slice(0, TOOL_KEYWORD_PROBE_MAX))
}

/** 是否像用户粘贴的多行/长文（优先文本编辑，除非有强工具名意图） */
export function looksLikePlainDocument(raw: string): boolean {
  const t = raw.trim()
  if (t.length < 48) return false
  const lines = t.split(/\r?\n/).filter((l) => l.trim())
  return lines.length >= 2 || t.length >= 160
}

/** 工具名/关键词强匹配阈值（高于此才认为「用户想找某个工具」） */
const STRONG_TOOL_MATCH_SCORE = 72

function hasStrongToolKeywordMatch(query: string): boolean {
  const tokens = queryTokensForToolSearch(query)
  if (!tokens.length) return false

  let best = 0
  let bestId = ''
  for (const tool of siteTools) {
    if (tool.id === 'more' || !tool.path) continue
    const score = scoreTool(tool, tokens)
    if (score > best) {
      best = score
      bestId = tool.id
    }
  }
  if (best < STRONG_TOOL_MATCH_SCORE) return false
  const id = bestId.toLowerCase()
  const explicitToolIntent = tokens.some(
    (t) => t === id || (t.length >= 2 && (id.startsWith(t) || t.startsWith(id)))
  )
  if (explicitToolIntent) return true
  return best >= 95
}

/**
 * 搜索框可展示的最大字符数（与桌面剪贴板读取上限一致）。
 * 约 13,981,856 字符，对应约 10MB 二进制 / Base64 图片上限。
 */
export const SEARCH_MAX_DISPLAY_CHARS = MAX_CLIPBOARD_TEXT_CHARS

export function base64ContentHintFromText(text: string): ContentHint | null {
  const unquoted = stripWrappingDoubleQuotes(text)
  if (extractDataUriBase64Payload(unquoted) !== null) {
    return { kind: 'base64', toolId: 'base64', label: 'Data URI（Base64 图片/文件）' }
  }
  const compact = unquoted.replace(/\s/g, '')
  if (compact.length >= 8 && compact.length % 4 === 0 && looksLikeRawBase64(compact)) {
    return { kind: 'base64', toolId: 'base64', label: 'Base64 文本' }
  }
  if (looksLikeProbableBase64Payload(text)) {
    return {
      kind: 'base64',
      toolId: 'base64',
      label: /^data:[^;\s]+;base64,/i.test(unquoted)
        ? 'Data URI（Base64 图片/文件）'
        : 'Base64 文本'
    }
  }
  return null
}

function fieldIncludes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle)
}

function isUnixTimestampDigits(value: string): boolean {
  return /^\d{10}$/.test(value) || /^\d{13}$/.test(value)
}

function isCalculatorLike(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  if (/^[0-9+\-*/%^().\s]+$/.test(t) && /[+\-*/%^]/.test(t) && /\d/.test(t)) return true
  if (/^\d+(\.\d+)?$/.test(t) && !isUnixTimestampDigits(t)) return true
  return false
}

function calculatorHintFor(value: string): ContentHint | null {
  const t = value.trim()
  if (!isCalculatorLike(t)) return null
  if (/[+\-*/%^]/.test(t)) {
    return { kind: 'calculator', toolId: 'calculator', label: '算式' }
  }
  return { kind: 'calculator', toolId: 'calculator', label: '数字' }
}

function scoreTool(tool: SiteTool, tokens: string[]): number {
  if (!tokens.length) return tool.id === 'more' ? 0 : 1

  if (tool.id === 'more' && !tool.path) {
    const hit = tokens.some(
      (t) =>
        fieldIncludes(tool.name, t) ||
        tool.keywords?.some((k) => fieldIncludes(k, t))
    )
    return hit ? 5 : -1
  }

  let score = 0
  const name = tool.name.toLowerCase()
  const desc = tool.desc.toLowerCase()
  const id = tool.id.toLowerCase()
  const keywords = (tool.keywords ?? []).map((k) => k.toLowerCase())
  const pinyinAliases = getToolPinyinAliases(tool)

  let matchedTokens = 0
  for (const token of tokens) {
    let tokenScore = 0
    if (name === token) tokenScore = Math.max(tokenScore, 120)
    else if (name.startsWith(token)) tokenScore = Math.max(tokenScore, 100)
    else if (fieldIncludes(name, token)) tokenScore = Math.max(tokenScore, 85)

    if (id === token) tokenScore = Math.max(tokenScore, 90)
    else if (fieldIncludes(id, token)) tokenScore = Math.max(tokenScore, 70)

    for (const kw of keywords) {
      if (kw === token) tokenScore = Math.max(tokenScore, 75)
      else if (kw.startsWith(token)) tokenScore = Math.max(tokenScore, 65)
      else if (fieldIncludes(kw, token)) tokenScore = Math.max(tokenScore, 50)
    }

    if (tool.id === 'base64') {
      const b64Tok = stripWrappingDoubleQuotes(token)
      if (/;base64,/i.test(b64Tok) && b64Tok.startsWith('data:')) {
        tokenScore = Math.max(tokenScore, 92)
      } else {
        const compact = b64Tok.replace(/\s/g, '')
        if (
          compact.length >= 8 &&
          compact.length % 4 === 0 &&
          looksLikeRawBase64(compact)
        ) {
          tokenScore = Math.max(tokenScore, 90)
        }
      }
    }

    for (const py of pinyinAliases) {
      if (py === token) tokenScore = Math.max(tokenScore, 82)
      else if (py.startsWith(token)) tokenScore = Math.max(tokenScore, 72)
      else if (token.length >= 2 && fieldIncludes(py, token)) tokenScore = Math.max(tokenScore, 58)
    }

    if (fieldIncludes(desc, token)) tokenScore = Math.max(tokenScore, 25)

    if (isCalculatorLike(token)) {
      if (tool.id === 'calculator') {
        tokenScore = Math.max(tokenScore, isUnixTimestampDigits(token) ? 0 : 88)
      }
      if (tool.id === 'timestamp' && isUnixTimestampDigits(token)) {
        tokenScore = Math.max(tokenScore, 95)
      }
    }

    if (tokenScore === 0) continue
    matchedTokens++
    score += tokenScore
  }

  if (matchedTokens === 0) return -1
  if (tool.path) score += 3
  return score
}

function approximatePayloadBytes(text: string): number {
  const unquoted = stripWrappingDoubleQuotes(text)
  const dataUri = extractDataUriBase64Payload(unquoted)
  if (dataUri) return Math.floor((dataUri.replace(/\s/g, '').length * 3) / 4)
  const compact = unquoted.replace(/\s/g, '')
  if (compact.length >= 8 && compact.length % 4 === 0 && looksLikeRawBase64(compact)) {
    return Math.floor((compact.length * 3) / 4)
  }
  return new TextEncoder().encode(text).length
}

/** 超过剪贴板上限时才分离 payload */
export function shouldHoldSearchPayload(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return t.length > SEARCH_MAX_DISPLAY_CHARS
}

/** 输入框内展示的截断原文（非「已识别…」摘要） */
export function formatSearchPayloadDisplay(text: string): string {
  const t = text.trim()
  const max = SEARCH_MAX_DISPLAY_CHARS
  if (t.length <= max) return t
  let cut = t.slice(0, max)
  const lastNl = cut.lastIndexOf('\n')
  if (lastNl > max * 0.4) {
    cut = cut.slice(0, lastNl)
  }
  return `${cut.replace(/\s+$/, '')}…`
}

export function formatSearchPayloadSize(text: string): string {
  const approx = approximatePayloadBytes(text.trim())
  if (approx >= 1024 * 1024) return `${(approx / (1024 * 1024)).toFixed(1)} MB`
  if (approx >= 1024) return `${(approx / 1024).toFixed(1)} KB`
  return `${approx} B`
}

export function detectContentHint(raw: string): ContentHint | null {
  const t = raw.trim()
  if (!t) return null

  const unquoted = stripWrappingDoubleQuotes(t)

  // 引号包裹的 Base64 是合法 JSON 字符串，须在 JSON.parse 之前识别
  const base64Hint = base64ContentHintFromText(t)
  if (base64Hint) return base64Hint

  try {
    const parsed = JSON.parse(t)
    if (typeof parsed === 'string') {
      const inner = detectContentHint(parsed)
      if (inner) return inner
      return null
    }
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      const digits = String(Math.trunc(parsed))
      if (isUnixTimestampDigits(digits)) {
        return { kind: 'timestamp', toolId: 'timestamp', label: 'Unix 时间戳' }
      }
      return calculatorHintFor(digits)
    }
    if (parsed === null || typeof parsed === 'boolean') {
      return null
    }
    if (typeof parsed === 'object') {
      return { kind: 'json', toolId: 'json', label: 'JSON 数据' }
    }
  } catch {
    /* not JSON */
  }

  const firstLine = unquoted.split(/\r?\n/)[0]?.trim() ?? unquoted
  const firstToken = firstLine.split(/\s+/)[0] ?? firstLine

  if (/^https?:\/\//i.test(firstToken) || /^[a-z][a-z0-9+.-]*:\/\//i.test(firstToken)) {
    try {
      new URL(firstToken)
      return { kind: 'url', toolId: 'url', label: 'URL 链接' }
    } catch {
      /* ignore */
    }
  }

  if (isUnixTimestampDigits(unquoted)) {
    return { kind: 'timestamp', toolId: 'timestamp', label: 'Unix 时间戳' }
  }

  const calcHint = calculatorHintFor(unquoted)
  if (calcHint) return calcHint

  if (UUID_RE.test(unquoted)) {
    return { kind: 'uuid', toolId: 'uuid', label: 'UUID' }
  }

  if (SHA256_RE.test(unquoted) || MD5_RE.test(unquoted)) {
    return { kind: 'hash', toolId: 'hash', label: '哈希值' }
  }

  return null
}

/**
 * 内容识别 + 可选文本编辑兜底。
 * 先判断 JSON / Base64 / URL 等类型；若无类型且未命中任何工具关键词，则归入文本编辑。
 */
export function resolveSearchContentHint(
  query: string,
  enableTextFallback = false
): ContentHint | null {
  const typed = detectContentHint(query)
  if (typed) return typed
  if (!enableTextFallback || !query.trim()) return null

  if (looksLikePlainDocument(query) && !hasStrongToolKeywordMatch(query)) {
    return TEXT_FALLBACK_HINT
  }
  if (!hasStrongToolKeywordMatch(query)) {
    return TEXT_FALLBACK_HINT
  }
  return null
}

/** 剪贴板 / 全文粘贴：启用文本编辑兜底 */
export function detectClipboardContentHint(raw: string): ContentHint | null {
  return resolveSearchContentHint(raw, true)
}

export function searchTools(query: string): ScoredTool[] {
  const q = query.trim()
  if (!q) {
    return siteTools
      .filter((t) => t.id !== 'more')
      .map((tool) => ({ tool, score: 1 }))
  }

  const hint = detectContentHint(q)
  const tokens = queryTokensForToolSearch(q)

  const scored = siteTools
    .map((tool) => ({ tool, score: scoreTool(tool, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (hint) {
    const primary = siteTools.find((t) => t.id === hint.toolId)
    if (primary) {
      const rest = scored.filter((item) => item.tool.id !== hint.toolId)
      return [{ tool: primary, score: 10_000 }, ...rest]
    }
  }

  return scored
}

export function rankToolsForQuery(query: string, limit?: number): SiteTool[] {
  const list = searchTools(query).map((item) => item.tool)
  if (limit == null) return list
  return list.slice(0, limit)
}

export interface ToolSearchResolveOptions {
  /** 最多返回几条；不设则返回全部匹配 */
  limit?: number
  /** 仅含已上线（有 path）的工具 */
  pathOnly?: boolean
  /** 剪贴板 / payload：无其它识别时兜底到文本编辑工具 */
  fallbackText?: boolean
}

function resolveContentHint(query: string, fallbackText: boolean): ContentHint | null {
  return resolveSearchContentHint(query, fallbackText)
}

function rankToolsWithHint(query: string, hint: ContentHint | null, pathOnly: boolean): SiteTool[] {
  let all = rankToolsForQuery(query).filter((t) => !pathOnly || t.path)
  if (hint) {
    const primary = siteTools.find((x) => x.id === hint.toolId)
    if (primary && (!pathOnly || primary.path)) {
      all = [primary, ...all.filter((t) => t.id !== hint.toolId)]
    }
  }
  return all
}

export interface ToolSearchResolveResult {
  hint: ContentHint | null
  tools: SiteTool[]
  /** 满足条件的匹配总数（不受 limit 截断） */
  totalCount: number
  showEmpty: boolean
}

/** Web / 桌面共用的搜索解析（匹配列表 + 内容识别 + 空态） */
export function resolveToolSearchResults(
  query: string,
  options: ToolSearchResolveOptions = {}
): ToolSearchResolveResult {
  const trimmed = query.trim()
  const pathOnly = options.pathOnly ?? false
  const limit = options.limit

  if (!trimmed) {
    return { hint: null, tools: [], totalCount: 0, showEmpty: false }
  }

  const hint = resolveContentHint(trimmed, options.fallbackText ?? false)
  const all = rankToolsWithHint(trimmed, hint, pathOnly)
  const totalCount = all.length
  const tools = limit != null ? all.slice(0, limit) : all

  if (tools.length) {
    return { hint, tools, totalCount, showEmpty: false }
  }

  if (hint) {
    const t = siteTools.find((x) => x.id === hint.toolId)
    const ok = t && (!pathOnly || t.path)
    if (ok) {
      return { hint, tools: [t], totalCount: 1, showEmpty: false }
    }
  }

  return {
    hint,
    tools: [],
    totalCount: 0,
    showEmpty: Boolean(trimmed) && !hint
  }
}

/** 桌面搜索：仅已上线工具，默认最多 6 条 */
export function resolveDisplayToolsForQuery(
  query: string,
  limit = 6,
  options?: Pick<ToolSearchResolveOptions, 'fallbackText'>
): ToolSearchResolveResult {
  return resolveToolSearchResults(query, { limit, pathOnly: true, fallbackText: options?.fallbackText })
}

/** 工具集筛选：与搜索框同一套匹配（含拼音） */
export function toolMatchesQuery(tool: SiteTool, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  if (tool.id === 'more') return false
  return scoreTool(tool, queryTokensForToolSearch(q)) > 0
}
