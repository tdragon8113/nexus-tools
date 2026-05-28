import { diffChars } from 'diff'
import type { AlignedLineRow } from '~/utils/jsonLineDiffView'
import {
  linesEqualForCompare,
  mergeTextDiffCompareOptions,
  normalizeLineForCompare,
  type TextDiffCompareOptions
} from '~/utils/textDiffOptions'
import type { TextDiffLineDecoration, TextDiffRangeDecoration } from '~/components/TextDiffCodeMirrorPane.vue'

export interface TextDiffBlock {
  /** 对齐视图中的行号（左右相同） */
  alignedLineNo: number
}

export function buildTextDiffBlocks(rows: AlignedLineRow[]): TextDiffBlock[] {
  const blocks: TextDiffBlock[] = []
  let current: TextDiffBlock | null = null
  let previousChanged = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.kind === 'equal') {
      current = null
      previousChanged = false
      continue
    }

    if (!current || !previousChanged) {
      current = { alignedLineNo: i + 1 }
      blocks.push(current)
    }
    previousChanged = true
  }

  return blocks
}

export function buildTextDiffLineDecorations(
  rows: AlignedLineRow[],
  side: 'left' | 'right'
): TextDiffLineDecoration[] {
  const decorations: TextDiffLineDecoration[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.kind === 'equal') continue
    const line = i + 1

    if (row.kind === 'delete') {
      if (side === 'left') decorations.push({ line, className: 'text-diff-line-del' })
      else decorations.push({ line, className: 'text-diff-line-pad' })
      continue
    }

    if (row.kind === 'insert') {
      if (side === 'right') decorations.push({ line, className: 'text-diff-line-add' })
      else decorations.push({ line, className: 'text-diff-line-pad' })
      continue
    }

    decorations.push({
      line,
      className: side === 'left' ? 'text-diff-line-change-left' : 'text-diff-line-change-right'
    })
  }

  return decorations
}

function charDiffForRow(
  left: string,
  right: string,
  compareOptions: TextDiffCompareOptions
): ReturnType<typeof diffChars> {
  const l = compareOptions.ignoreCase ? normalizeLineForCompare(left, compareOptions) : left
  const r = compareOptions.ignoreCase ? normalizeLineForCompare(right, compareOptions) : right
  return diffChars(l, r)
}

export function buildTextDiffRangeDecorations(
  rows: AlignedLineRow[],
  side: 'left' | 'right',
  options?: {
    enableCharDiff?: boolean
    compareOptions?: Partial<TextDiffCompareOptions>
  }
): TextDiffRangeDecoration[] {
  if (options?.enableCharDiff === false) return []

  const compareOptions = mergeTextDiffCompareOptions(options?.compareOptions)
  const ranges: TextDiffRangeDecoration[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const line = i + 1

    if (row.kind === 'equal') continue

    if (row.kind === 'delete') {
      if (side === 'left' && row.left.length > 0) {
        ranges.push({
          line,
          fromCh: 0,
          toCh: row.left.length,
          className: 'text-diff-char-del'
        })
      }
      continue
    }

    if (row.kind === 'insert') {
      if (side === 'right' && row.right.length > 0) {
        ranges.push({
          line,
          fromCh: 0,
          toCh: row.right.length,
          className: 'text-diff-char-add'
        })
      }
      continue
    }

    if (linesEqualForCompare(row.left, row.right, compareOptions)) continue

    let leftCh = 0
    let rightCh = 0
    for (const part of charDiffForRow(row.left, row.right, compareOptions)) {
      const len = part.value.length
      if (part.removed) {
        if (side === 'left' && len > 0) {
          ranges.push({
            line,
            fromCh: leftCh,
            toCh: leftCh + len,
            className: 'text-diff-char-del'
          })
        }
        leftCh += len
      } else if (part.added) {
        if (side === 'right' && len > 0) {
          ranges.push({
            line,
            fromCh: rightCh,
            toCh: rightCh + len,
            className: 'text-diff-char-add'
          })
        }
        rightCh += len
      } else {
        leftCh += len
        rightCh += len
      }
    }
  }

  return ranges
}
