import type { AlignedLineRow } from '~/utils/jsonLineDiffView'

/** 并排展示用：删/增处用空行占位，使左右同行对齐 */
export function buildAlignedSideText(rows: AlignedLineRow[], side: 'left' | 'right'): string {
  if (rows.length === 0) return ''
  return rows.map((row) => (side === 'left' ? row.left : row.right)).join('\n')
}

function splitDisplayLines(text: string): string[] {
  if (text === '') return []
  return text.split('\n')
}

/**
 * 对齐视图里 insert/delete 行在另一侧会有空行占位。
 * 仅当该行在对侧仅为占位且用户未编辑时，才从源文本还原中跳过。
 */
function includeDisplayLineInSource(
  row: AlignedLineRow,
  side: 'left' | 'right',
  displayLine: string
): boolean {
  const padKind = side === 'left' ? 'insert' : 'delete'
  if (row.kind !== padKind) return true
  return displayLine !== ''
}

/** 从对齐视图还原左侧源文本（去掉为右侧增行预留的空行） */
export function extractLeftSourceFromDisplay(displayText: string, rows: AlignedLineRow[]): string {
  const lines = splitDisplayLines(displayText)
  if (rows.length === 0) return displayText
  if (lines.length !== rows.length) return displayText

  const sourceLines: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const line = lines[i] ?? ''
    if (!includeDisplayLineInSource(rows[i], 'left', line)) continue
    sourceLines.push(line)
  }
  return sourceLines.join('\n')
}

/** 从对齐视图还原右侧源文本（去掉为左侧删行预留的空行） */
export function extractRightSourceFromDisplay(displayText: string, rows: AlignedLineRow[]): string {
  const lines = splitDisplayLines(displayText)
  if (rows.length === 0) return displayText
  if (lines.length !== rows.length) return displayText

  const sourceLines: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const line = lines[i] ?? ''
    if (!includeDisplayLineInSource(rows[i], 'right', line)) continue
    sourceLines.push(line)
  }
  return sourceLines.join('\n')
}
