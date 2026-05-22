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

export interface ContentHint {
  kind: ContentHintKind
  toolId: string
  label: string
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
  return tokens
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

    if (tokenScore === 0) return -1
    score += tokenScore
  }

  if (tool.path) score += 3
  return score
}

export function detectContentHint(raw: string): ContentHint | null {
  const t = raw.trim()
  if (!t) return null

  try {
    JSON.parse(t)
    return { kind: 'json', toolId: 'json', label: 'JSON 数据' }
  } catch {
    /* not JSON */
  }

  const firstLine = t.split(/\r?\n/)[0]?.trim() ?? t
  const firstToken = firstLine.split(/\s+/)[0] ?? firstLine

  if (/^https?:\/\//i.test(firstToken) || /^[a-z][a-z0-9+.-]*:\/\//i.test(firstToken)) {
    try {
      new URL(firstToken)
      return { kind: 'url', toolId: 'url', label: 'URL 链接' }
    } catch {
      /* ignore */
    }
  }

  if (isUnixTimestampDigits(t)) {
    return { kind: 'timestamp', toolId: 'timestamp', label: 'Unix 时间戳' }
  }

  const calcHint = calculatorHintFor(t)
  if (calcHint) return calcHint

  if (UUID_RE.test(t)) {
    return { kind: 'uuid', toolId: 'uuid', label: 'UUID' }
  }

  if (SHA256_RE.test(t) || MD5_RE.test(t)) {
    return { kind: 'hash', toolId: 'hash', label: '哈希值' }
  }

  if (t.length >= 8 && t.length % 4 === 0 && BASE64_RE.test(t) && /[+/=]/.test(t)) {
    return { kind: 'base64', toolId: 'base64', label: 'Base64 文本' }
  }

  return null
}

export function searchTools(query: string): ScoredTool[] {
  const q = query.trim()
  if (!q) {
    return siteTools
      .filter((t) => t.id !== 'more')
      .map((tool) => ({ tool, score: 1 }))
  }

  const hint = detectContentHint(q)
  const tokens = tokenizeQuery(q)

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

  const hint = detectContentHint(trimmed)
  const all = rankToolsForQuery(trimmed).filter((t) => !pathOnly || t.path)
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
  limit = 6
): ToolSearchResolveResult {
  return resolveToolSearchResults(query, { limit, pathOnly: true })
}

/** 工具集筛选：与搜索框同一套匹配（含拼音） */
export function toolMatchesQuery(tool: SiteTool, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  if (tool.id === 'more') return false
  return scoreTool(tool, tokenizeQuery(q)) > 0
}
