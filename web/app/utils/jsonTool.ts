import { visit, type JSONPath } from 'jsonc-parser'

export type IndentMode = '1' | '2' | '3' | '4' | 'tab'

function jsonPathId(path: JSONPath): string {
  return JSON.stringify(path)
}

/**
 * 在已通过 JSON.parse 的文本上检测同一对象内重复键，返回第二次出现的键名位置。
 * 标准 JSON.parse 对重复键静默取后者，不报错。
 */
function findFirstDuplicateObjectKey(
  jsonText: string
): { key: string; offsetInSlice: number } | null {
  const keysPerObject = new Map<string, Set<string>>()
  let found: { key: string; offsetInSlice: number } | null = null

  visit(
    jsonText,
    {
      onObjectProperty(property, offset, _length, _sl, _sc, pathSupplier) {
        if (found) return
        const id = jsonPathId(pathSupplier())
        let set = keysPerObject.get(id)
        if (!set) {
          set = new Set()
          keysPerObject.set(id, set)
        }
        if (set.has(property)) {
          found = { key: property, offsetInSlice: offset }
          return
        }
        set.add(property)
      }
    },
    { disallowComments: true }
  )
  return found
}

export function getIndent(mode: IndentMode): string | number {
  if (mode === 'tab') return '\t'
  return Number(mode) as 1 | 2 | 3 | 4
}

/** 递归排序对象键（数组元素保持顺序） */
export function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  const o = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(o).sort()) {
    out[k] = sortKeysDeep(o[k])
  }
  return out
}

/** 与 JSON.parse 使用相同的切片：去 BOM、trim，并返回该片在原始字符串中的起始下标 */
export function sliceForJsonParse(raw: string): { slice: string; start: number } {
  let bomSkip = 0
  if (raw.length > 0 && raw.charCodeAt(0) === 0xfeff) bomSkip = 1
  const noBom = raw.slice(bomSkip)
  const trimmed = noBom.trim()
  if (!trimmed) return { slice: '', start: raw.length }
  const lead = noBom.length - noBom.trimStart().length
  return { slice: trimmed, start: bomSkip + lead }
}

/** 从引擎报错信息中推断错误在 parse 切片内的字符偏移（0-based） */
export function errorOffsetInParseText(message: string, parseText: string): number | null {
  const posM = message.match(/position\s+(\d+)/i)
  if (posM) {
    const n = Number(posM[1])
    if (!Number.isFinite(n) || n < 0) return null
    if (parseText.length === 0) return 0
    if (n >= parseText.length) return parseText.length - 1
    return n
  }
  const lcM = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (lcM) {
    const line = Number(lcM[1])
    const col = Number(lcM[2])
    return lineColToOffset(parseText, line, col)
  }
  return null
}

function lineColToOffset(text: string, line1: number, col1: number): number | null {
  if (line1 < 1 || col1 < 1) return null
  let line = 1
  let col = 1
  for (let i = 0; i < text.length; i++) {
    if (line === line1 && col === col1) return i
    const ch = text[i]
    if (ch === '\r') {
      if (text[i + 1] === '\n') {
        i++
        line++
        col = 1
      } else {
        line++
        col = 1
      }
    } else if (ch === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }
  if (line === line1 && col === col1) return text.length
  return null
}

export function parseJson(
  raw: string
):
  | { ok: true; value: unknown }
  | { ok: false; message: string; errorIndexInRaw: number | null } {
  const { slice, start } = sliceForJsonParse(raw)
  if (!slice) return { ok: false, message: '内容为空', errorIndexInRaw: null }
  try {
    const value = JSON.parse(slice)
    const dup = findFirstDuplicateObjectKey(slice)
    if (dup) {
      const at = start + dup.offsetInSlice
      const errorIndexInRaw = raw.length === 0 ? null : Math.min(Math.max(at, 0), raw.length - 1)
      return {
        ok: false,
        message: `重复的对象键「${dup.key}」（同一对象内键名必须唯一）`,
        errorIndexInRaw
      }
    }
    return { ok: true, value }
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : 'JSON 解析失败'
    const off = errorOffsetInParseText(msg, slice)
    if (off == null) return { ok: false, message: msg, errorIndexInRaw: null }
    const at = start + off
    if (raw.length === 0) return { ok: false, message: msg, errorIndexInRaw: null }
    const errorIndexInRaw = Math.min(Math.max(at, 0), raw.length - 1)
    return { ok: false, message: msg, errorIndexInRaw }
  }
}

export function lineCountFor(text: string): number {
  if (!text) return 1
  return text.split(/\r\n|\r|\n/).length
}
