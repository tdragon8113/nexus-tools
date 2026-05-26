import {
  parse as jsoncParse,
  ParseErrorCode,
  printParseErrorCode,
  visit,
  type JSONPath,
  type ParseError
} from 'jsonc-parser'

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

/** 优先报告根因类错误，避免尾随逗号等连带标在 `}`、`,` 上 */
const PRIMARY_JSONC_ERROR_CODES = new Set<ParseErrorCode>([
  ParseErrorCode.InvalidSymbol,
  ParseErrorCode.InvalidNumberFormat,
  ParseErrorCode.PropertyNameExpected,
  ParseErrorCode.ValueExpected,
  ParseErrorCode.ColonExpected,
  ParseErrorCode.InvalidUnicode,
  ParseErrorCode.InvalidEscapeCharacter,
  ParseErrorCode.InvalidCharacter,
  ParseErrorCode.UnexpectedEndOfString,
  ParseErrorCode.UnexpectedEndOfNumber,
  ParseErrorCode.InvalidCommentToken,
  ParseErrorCode.UnexpectedEndOfComment
])

function jsoncParseErrors(slice: string): ParseError[] {
  const errors: ParseError[] = []
  jsoncParse(slice, errors, { disallowComments: true })
  return errors
}

function pickPrimaryJsoncError(errors: ParseError[]): ParseError | null {
  if (!errors.length) return null
  return errors.find((e) => PRIMARY_JSONC_ERROR_CODES.has(e.error)) ?? errors[0]
}

function jsoncErrorMessage(err: ParseError): string {
  const zh: Partial<Record<ParseErrorCode, string>> = {
    [ParseErrorCode.InvalidSymbol]: '无效的符号',
    [ParseErrorCode.InvalidNumberFormat]: '数字格式无效',
    [ParseErrorCode.PropertyNameExpected]: '需要属性名（双引号字符串）',
    [ParseErrorCode.ValueExpected]: '需要合法的 JSON 值（字符串请使用双引号）',
    [ParseErrorCode.ColonExpected]: '缺少冒号',
    [ParseErrorCode.CommaExpected]: '缺少逗号',
    [ParseErrorCode.CloseBraceExpected]: '缺少右花括号',
    [ParseErrorCode.CloseBracketExpected]: '缺少右方括号',
    [ParseErrorCode.EndOfFileExpected]: '意外的文件结束',
    [ParseErrorCode.UnexpectedEndOfString]: '字符串未正确结束',
    [ParseErrorCode.UnexpectedEndOfNumber]: '数字未正确结束',
    [ParseErrorCode.InvalidUnicode]: '无效的 Unicode 转义',
    [ParseErrorCode.InvalidEscapeCharacter]: '无效的转义字符',
    [ParseErrorCode.InvalidCharacter]: '无效的字符'
  }
  return zh[err.error] ?? printParseErrorCode(err.error)
}

function sliceRangeToRaw(
  raw: string,
  sliceStart: number,
  offsetInSlice: number,
  lengthInSlice: number
): { from: number; to: number } {
  const from = Math.min(Math.max(sliceStart + offsetInSlice, 0), raw.length)
  const to = Math.min(Math.max(sliceStart + offsetInSlice + Math.max(lengthInSlice, 1), from + 1), raw.length)
  return { from, to }
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
  | { ok: false; message: string; errorFromInRaw: number | null; errorToInRaw: number | null } {
  const { slice, start } = sliceForJsonParse(raw)
  if (!slice) return { ok: false, message: '内容为空', errorFromInRaw: null, errorToInRaw: null }
  try {
    const value = JSON.parse(slice)
    const dup = findFirstDuplicateObjectKey(slice)
    if (dup) {
      const { from, to } = sliceRangeToRaw(raw, start, dup.offsetInSlice, dup.key.length)
      return {
        ok: false,
        message: `重复的对象键「${dup.key}」（同一对象内键名必须唯一）`,
        errorFromInRaw: from,
        errorToInRaw: to
      }
    }
    return { ok: true, value }
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : 'JSON 解析失败'
    const off = errorOffsetInParseText(msg, slice)
    if (off != null) {
      const { from, to } = sliceRangeToRaw(raw, start, off, 1)
      return { ok: false, message: msg, errorFromInRaw: from, errorToInRaw: to }
    }
    const primary = pickPrimaryJsoncError(jsoncParseErrors(slice))
    if (primary) {
      const { from, to } = sliceRangeToRaw(raw, start, primary.offset, primary.length)
      return {
        ok: false,
        message: jsoncErrorMessage(primary),
        errorFromInRaw: from,
        errorToInRaw: to
      }
    }
    return { ok: false, message: msg, errorFromInRaw: null, errorToInRaw: null }
  }
}

export function lineCountFor(text: string): number {
  if (!text) return 1
  return text.split(/\r\n|\r|\n/).length
}

/** 统一换行符，避免 Windows 剪贴板 \\r\\n 造成行号错位 */
export function normalizeJsonInput(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/** 去掉文末连续空行（粘贴时常带入） */
export function trimTrailingBlankLines(text: string): string {
  if (!text) return text
  return text.replace(/(\n[ \t]*)+$/g, '')
}
