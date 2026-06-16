export class CsvParseError extends Error {
  constructor(
    message: string,
    readonly line = 1,
    readonly column = 1
  ) {
    super(message)
    this.name = 'CsvParseError'
  }
}

/** RFC 4180 风格解析（逗号分隔、双引号转义、引号内可含换行） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let line = 1
  let column = 1
  let inQuotes = false
  let i = 0

  const pushField = () => {
    row.push(field)
    field = ''
  }

  const pushRow = () => {
    rows.push(row)
    row = []
  }

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          column += 2
          continue
        }
        inQuotes = false
        i++
        column++
        continue
      }
      if (ch === '\n') {
        line++
        column = 1
      } else if (ch === '\r') {
        if (text[i + 1] === '\n') {
          line++
          column = 1
        }
      } else {
        column++
      }
      field += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      column++
      continue
    }

    if (ch === ',') {
      pushField()
      i++
      column++
      continue
    }

    if (ch === '\r') {
      pushField()
      pushRow()
      i++
      if (text[i] === '\n') i++
      line++
      column = 1
      continue
    }

    if (ch === '\n') {
      pushField()
      pushRow()
      i++
      line++
      column = 1
      continue
    }

    field += ch
    i++
    column++
  }

  if (inQuotes) {
    throw new CsvParseError('未闭合的引号', line, column)
  }

  pushField()
  if (row.length > 1 || row[0] !== '' || rows.length === 0) {
    pushRow()
  }

  while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === '')) {
    rows.pop()
  }

  return rows
}

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')
}

const ALT_DELIMITERS = ['\t', ';', '|'] as const

function splitSimpleLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim())
}

function rowsFromDelimiter(text: string, delimiter: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => splitSimpleLine(line, delimiter))
}

function maxColumnCount(rows: string[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0)
}

/** 在制表符、分号、竖线等分隔符中选出最像表格的一种 */
function detectBestDelimiter(text: string): string | null {
  const sample = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, 12)
  if (!sample.length) return null

  let best: { delimiter: string; columns: number } | null = null

  for (const delimiter of ALT_DELIMITERS) {
    const counts = sample.map((line) => splitSimpleLine(line, delimiter).length)
    const columns = counts[0] ?? 0
    if (columns <= 1) continue
    if (!counts.every((count) => count === columns)) continue
    if (!best || columns > best.columns) {
      best = { delimiter, columns }
    }
  }

  return best?.delimiter ?? null
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function jsonValueToRows(value: unknown): string[][] | null {
  if (!Array.isArray(value) || !value.length) return null

  if (Array.isArray(value[0])) {
    return value.map((row) =>
      Array.isArray(row) ? row.map((cell) => cellToString(cell)) : [cellToString(row)]
    )
  }

  if (typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
    const keys = [
      ...value.reduce((set, item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          for (const key of Object.keys(item as Record<string, unknown>)) {
            set.add(key)
          }
        }
        return set
      }, new Set<string>())
    ]
    if (!keys.length) return null
    const body = value.map((item) => {
      const record =
        item && typeof item === 'object' && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {}
      return keys.map((key) => cellToString(record[key]))
    })
    return [keys, ...body]
  }

  return null
}

async function tryJsonToCsvRows(text: string): Promise<string[][] | null> {
  const { stripJsValueWrapper } = await import('~/utils/jsonFormat')
  const candidates = [...new Set([text.trim(), stripJsValueWrapper(text)])]

  for (const candidate of candidates) {
    let parsed: unknown
    try {
      parsed = JSON.parse(candidate)
    } catch {
      try {
        const { default: JSON5 } = await import('json5')
        parsed = JSON5.parse(candidate)
      } catch {
        continue
      }
    }
    const rows = jsonValueToRows(parsed)
    if (rows) return rows
  }

  return null
}

function inferCsvRows(text: string): string[][] {
  try {
    const commaRows = parseCsv(text)
    if (maxColumnCount(commaRows) > 1) return commaRows

    const delimiter = detectBestDelimiter(text)
    if (delimiter) {
      const altRows = rowsFromDelimiter(text, delimiter)
      if (maxColumnCount(altRows) > 1) return altRows
    }

    if (commaRows.length) return commaRows
  } catch (e) {
    if (!(e instanceof CsvParseError)) throw e

    const delimiter = detectBestDelimiter(text)
    if (delimiter) {
      const altRows = rowsFromDelimiter(text, delimiter)
      if (maxColumnCount(altRows) > 1) return altRows
    }
    throw e
  }

  throw new CsvParseError('无法识别为表格数据')
}

/** 从 CSV/TSV/JSON 等文本解析为二维表格 */
export async function parseDelimitedOrJsonTable(text: string): Promise<string[][]> {
  const trimmed = text.trim()
  if (!trimmed) return []

  const fromJson = await tryJsonToCsvRows(trimmed)
  if (fromJson) return fromJson

  return inferCsvRows(trimmed)
}

/**
 * 将多种表格文本规范为 CSV：逗号分隔、LF 换行，必要时为字段加引号。
 * 支持 TSV/分号/竖线分隔，以及 JSON/JSON5 数组（含对象数组表头）。
 */
export async function formatCsvSource(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const fromJson = await tryJsonToCsvRows(trimmed)
  if (fromJson) return rowsToCsv(fromJson)

  return rowsToCsv(inferCsvRows(trimmed))
}

/** 规范为逗号分隔、LF 换行，必要时为字段加引号 */
export async function formatCsv(text: string): Promise<string> {
  return formatCsvSource(text)
}

export interface CsvLintIssue {
  line: number
  message: string
}

export function lintCsv(text: string): CsvLintIssue[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  let rows: string[][]
  try {
    rows = parseCsv(trimmed)
  } catch (e) {
    if (e instanceof CsvParseError) {
      return [{ line: e.line, message: e.message }]
    }
    return [{ line: 1, message: e instanceof Error ? e.message : 'CSV 解析失败' }]
  }

  if (!rows.length) return []

  const expected = rows[0].length
  const issues: CsvLintIssue[] = []
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== expected) {
      issues.push({
        line: i + 1,
        message: `列数为 ${rows[i].length}，首行为 ${expected}`
      })
    }
  }
  return issues
}
