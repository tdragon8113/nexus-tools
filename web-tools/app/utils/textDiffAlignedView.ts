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

/** 从对齐视图还原左侧源文本（去掉为右侧增行预留的空行） */
export function extractLeftSourceFromDisplay(displayText: string, rows: AlignedLineRow[]): string {
  const lines = splitDisplayLines(displayText)
  if (rows.length === 0) return displayText
  if (lines.length !== rows.length) return displayText

  const sourceLines: string[] = []
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].kind === 'insert') continue
    sourceLines.push(lines[i] ?? '')
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
    if (rows[i].kind === 'delete') continue
    sourceLines.push(lines[i] ?? '')
  }
  return sourceLines.join('\n')
}
