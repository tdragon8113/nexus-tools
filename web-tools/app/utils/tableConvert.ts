import { CsvParseError, parseDelimitedOrJsonTable, rowsToCsv } from '~/utils/csvTool'

export type TableOutputFormat =
  | 'csv'
  | 'tsv'
  | 'json-objects'
  | 'json-2d'
  | 'json-columns'
  | 'markdown'
  | 'html'
  | 'sql'
  | 'yaml'
  | 'latex'

export type TableIndent = '2' | '4' | 'tab'

export interface TableExportOptions {
  hasHeader?: boolean
  minify?: boolean
  indent?: TableIndent
  sqlTableName?: string
  jsonRootKey?: string
}

export const TABLE_OUTPUT_FORMATS: { id: TableOutputFormat; label: string }[] = [
  { id: 'csv', label: 'CSV' },
  { id: 'tsv', label: 'TSV' },
  { id: 'json-objects', label: 'JSON 对象数组' },
  { id: 'json-2d', label: 'JSON 二维数组' },
  { id: 'json-columns', label: 'JSON 列数组' },
  { id: 'markdown', label: 'Markdown 表格' },
  { id: 'html', label: 'HTML 表格' },
  { id: 'sql', label: 'SQL INSERT' },
  { id: 'yaml', label: 'YAML' },
  { id: 'latex', label: 'LaTeX' }
]

export const SAMPLE_TABLE_ROWS: string[][] = [
  ['Product', 'Price', 'Stock'],
  ['Laptop', '$999', '15'],
  ['Mouse', '$29', '50'],
  ['Keyboard', '$79', '25']
]

function maxColumnCount(rows: string[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0)
}

export function normalizeRows(rows: string[][]): string[][] {
  const cols = maxColumnCount(rows)
  if (!cols) return []
  return rows.map((row) => {
    const next = row.map((cell) => (cell ?? '').toString())
    while (next.length < cols) next.push('')
    return next
  })
}

export function transposeRows(rows: string[][]): string[][] {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return []
  const cols = normalized[0].length
  return Array.from({ length: cols }, (_, columnIndex) =>
    normalized.map((row) => row[columnIndex] ?? '')
  )
}

export function removeEmptyRows(rows: string[][]): string[][] {
  return rows.filter((row) => row.some((cell) => cell.trim() !== ''))
}

export function dedupeRows(rows: string[][]): string[][] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = row.join('\u001e')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function parseTableTextInput(text: string): Promise<string[][]> {
  return normalizeRows(await parseDelimitedOrJsonTable(text))
}

export async function parseTableExcelBuffer(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  return normalizeRows(
    raw.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))
        : [String(row)]
    )
  )
}

function indentUnit(indent: TableIndent): string {
  if (indent === 'tab') return '\t'
  return indent === '4' ? '    ' : '  '
}

function stringifyJson(value: unknown, options: TableExportOptions): string {
  if (options.minify) return JSON.stringify(value)
  const space = indentUnit(options.indent ?? '2')
  return JSON.stringify(value, null, space)
}

function splitHeaderBody(rows: string[][], hasHeader: boolean): {
  headers: string[]
  body: string[][]
} {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return { headers: [], body: [] }
  if (!hasHeader) {
    const width = normalized[0].length
    return {
      headers: Array.from({ length: width }, (_, index) => `column${index + 1}`),
      body: normalized
    }
  }
  return {
    headers: normalized[0].map((cell, index) => cell.trim() || `column${index + 1}`),
    body: normalized.slice(1)
  }
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((header) => {
    const base = header.trim() || 'column'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}_${count + 1}`
  })
}

function rowsToTsv(rows: string[][]): string {
  return normalizeRows(rows)
    .map((row) => row.join('\t'))
    .join('\n')
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function rowsToMarkdownTable(rows: string[][], hasHeader: boolean): string {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return ''

  const { headers, body } = splitHeaderBody(normalized, hasHeader)
  const headerLine = `| ${headers.map(escapeMarkdownCell).join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const bodyLines = body.map(
    (row) => `| ${headers.map((_, index) => escapeMarkdownCell(row[index] ?? '')).join(' | ')} |`
  )
  return [headerLine, separator, ...bodyLines].join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function rowsToHtmlTable(rows: string[][], hasHeader: boolean): string {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return ''

  const { headers, body } = splitHeaderBody(normalized, hasHeader)
  const thead = `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${body
    .map(
      (row) =>
        `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`
    )
    .join('')}</tbody>`
  return `<table>\n${thead}\n${tbody}\n</table>`
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlLiteral(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') return "''"
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed
  if (trimmed === 'true' || trimmed === 'false') return trimmed
  return `'${escapeSqlString(value)}'`
}

export function rowsToSqlInsert(
  rows: string[][],
  hasHeader: boolean,
  tableName = 'table_name'
): string {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return ''

  const safeTable = tableName.trim() || 'table_name'
  const { headers, body } = splitHeaderBody(normalized, hasHeader)
  const columns = uniqueHeaders(headers)

  return body
    .map((row) => {
      const values = columns.map((_, index) => sqlLiteral(row[index] ?? ''))
      return `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${values.join(', ')});`
    })
    .join('\n')
}

function rowsToJsonObjects(rows: string[][], hasHeader: boolean): unknown[] {
  const { headers, body } = splitHeaderBody(rows, hasHeader)
  const keys = uniqueHeaders(headers)
  return body.map((row) =>
    Object.fromEntries(keys.map((key, index) => [key, row[index] ?? '']))
  )
}

function rowsToJsonColumns(rows: string[][], hasHeader: boolean): Record<string, string[]> {
  const { headers, body } = splitHeaderBody(rows, hasHeader)
  const keys = uniqueHeaders(headers)
  return Object.fromEntries(
    keys.map((key, index) => [key, body.map((row) => row[index] ?? '')])
  )
}

function rowsToJson2d(rows: string[][]): string[][] {
  return normalizeRows(rows)
}

function escapeYamlString(value: string): string {
  if (/[\n:#"'[\]{}&,*?|>!@%`]/.test(value) || value.trim() !== value) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

export function rowsToYaml(rows: string[][], hasHeader: boolean): string {
  const objects = rowsToJsonObjects(rows, hasHeader) as Record<string, string>[]
  if (!objects.length) return ''

  return `${objects
    .map((item) => {
      const entries = Object.entries(item)
      if (!entries.length) return '-'
      const [firstKey, firstValue] = entries[0]
      let block = `- ${firstKey}: ${escapeYamlString(firstValue)}`
      for (const [key, value] of entries.slice(1)) {
        block += `\n  ${key}: ${escapeYamlString(value)}`
      }
      return block
    })
    .join('\n')}\n`
}

function escapeLatex(value: string): string {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (m) => `\\${m}`)
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
}

export function rowsToLatex(rows: string[][]): string {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return ''

  const cols = normalized[0].length
  const columnSpec = `|${'c|'.repeat(cols)}`
  const body = normalized
    .map((row) => `${row.map((cell) => escapeLatex(cell)).join(' & ')} \\\\`)
    .join('\n')
  return `\\begin{tabular}{${columnSpec}}\n\\hline\n${body}\n\\hline\n\\end{tabular}`
}

function wrapJsonRoot(value: unknown, options: TableExportOptions): unknown {
  const key = options.jsonRootKey?.trim()
  if (!key) return value
  return { [key]: value }
}

export function exportTable(
  rows: string[][],
  format: TableOutputFormat,
  options: TableExportOptions = {}
): string {
  const normalized = normalizeRows(rows)
  if (!normalized.length) return ''

  const hasHeader = options.hasHeader ?? true

  switch (format) {
    case 'csv':
      return rowsToCsv(normalized)
    case 'tsv':
      return rowsToTsv(normalized)
    case 'json-objects':
      return stringifyJson(
        wrapJsonRoot(rowsToJsonObjects(normalized, hasHeader), options),
        options
      )
    case 'json-2d':
      return stringifyJson(wrapJsonRoot(rowsToJson2d(normalized), options), options)
    case 'json-columns':
      return stringifyJson(wrapJsonRoot(rowsToJsonColumns(normalized, hasHeader), options), options)
    case 'markdown':
      return rowsToMarkdownTable(normalized, hasHeader)
    case 'html':
      return rowsToHtmlTable(normalized, hasHeader)
    case 'sql':
      return rowsToSqlInsert(normalized, hasHeader, options.sqlTableName)
    case 'yaml':
      return rowsToYaml(normalized, hasHeader)
    case 'latex':
      return rowsToLatex(normalized)
    default:
      return ''
  }
}

export function outputFileExtension(format: TableOutputFormat): string {
  switch (format) {
    case 'csv':
      return 'csv'
    case 'tsv':
      return 'tsv'
    case 'json-objects':
    case 'json-2d':
    case 'json-columns':
      return 'json'
    case 'markdown':
      return 'md'
    case 'html':
      return 'html'
    case 'sql':
      return 'sql'
    case 'yaml':
      return 'yaml'
    case 'latex':
      return 'tex'
    default:
      return 'txt'
  }
}

export function parseTableInputErrorMessage(error: unknown): string {
  if (error instanceof CsvParseError) return error.message
  return error instanceof Error ? error.message : '无法解析表格数据'
}
