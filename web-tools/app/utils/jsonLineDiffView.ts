import { diffChars, diffLines } from 'diff'
import { escapeHtml } from '~/utils/textTool'
import {
  linesEqualForCompare,
  mergeTextDiffCompareOptions,
  normalizeLineForCompare,
  type TextDiffCompareOptions
} from '~/utils/textDiffOptions'

export const LINE_DIFF_MAX_ROWS = 12000

export type LineDiffKind = 'equal' | 'insert' | 'delete' | 'change'

export type AlignedLineRow = {
  left: string
  right: string
  kind: LineDiffKind
}

function normalizeNewlines(text: string): string {
  // Make Windows/mac classic line endings comparable & displayable.
  // Convert CRLF and CR to LF.
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function textToLines(text: string): string[] {
  if (text === '') return []
  const normalized = normalizeNewlines(text)
  const endsWithNl = normalized.endsWith('\n')
  const body = endsWithNl ? normalized.slice(0, -1) : normalized
  if (body.length === 0 && !endsWithNl) return []
  return body.split('\n')
}

function linesFromDiffPartValue(raw: string): string[] {
  const normalized = normalizeNewlines(raw)
  const endsWithNl = normalized.endsWith('\n')
  const body = endsWithNl ? normalized.slice(0, -1) : normalized
  if (body.length === 0 && !endsWithNl) return []
  return body.split('\n')
}

/**
 * 将 diffLines 的删/增块成对 zip，得到左右对齐的行（便于并排滚动）。
 * 展示用原文行；比较按 compareOptions 规范化。
 */
export function alignedLineDiff(
  a: string,
  b: string,
  partialOpts?: Partial<TextDiffCompareOptions>
): AlignedLineRow[] {
  const opts = mergeTextDiffCompareOptions(partialOpts)
  const aLines = textToLines(a)
  const bLines = textToLines(b)
  const aCompare = aLines.map((line) => normalizeLineForCompare(line, opts)).join('\n')
  const bCompare = bLines.map((line) => normalizeLineForCompare(line, opts)).join('\n')
  const parts = diffLines(aCompare, bCompare, { ignoreWhitespace: opts.ignoreWhitespace })
  const rows: AlignedLineRow[] = []
  let aIdx = 0
  let bIdx = 0

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const lines = linesFromDiffPartValue(p.value)

    if (p.removed) {
      const next = parts[i + 1]
      if (next?.added) {
        const addLines = linesFromDiffPartValue(next.value)
        const max = Math.max(lines.length, addLines.length)
        for (let k = 0; k < max; k++) {
          const left = k < lines.length ? (aLines[aIdx++] ?? '') : ''
          const right = k < addLines.length ? (bLines[bIdx++] ?? '') : ''
          rows.push({
            left,
            right,
            kind: linesEqualForCompare(left, right, opts) ? 'equal' : 'change'
          })
        }
        i++
      } else {
        for (let k = 0; k < lines.length; k++) {
          const left = aLines[aIdx] ?? ''
          aIdx++
          if (opts.ignoreEmptyLines && left.trim() === '') {
            rows.push({ left, right: '', kind: 'equal' })
            continue
          }
          rows.push({ left, right: '', kind: 'delete' })
        }
      }
    } else if (p.added) {
      for (let k = 0; k < lines.length; k++) {
        const right = bLines[bIdx] ?? ''
        bIdx++
        if (opts.ignoreEmptyLines && right.trim() === '') {
          rows.push({ left: '', right, kind: 'equal' })
          continue
        }
        rows.push({ left: '', right, kind: 'insert' })
      }
    } else {
      for (let k = 0; k < lines.length; k++) {
        const left = aLines[aIdx] ?? ''
        const right = bLines[bIdx] ?? ''
        aIdx++
        bIdx++
        rows.push({
          left,
          right,
          kind: linesEqualForCompare(left, right, opts) ? 'equal' : 'change'
        })
      }
    }
  }

  return rows
}

export type LineDiffViewRow = {
  leftHtml: string
  rightHtml: string
  kind: LineDiffKind
  markLeft: '' | '-' | ' '
  markRight: '' | '+' | ' '
  /** 本行在 A 源文本中的行号；null 表示仅用于对齐，A 无此行 */
  leftLineNo: number | null
  /** 本行在 B 源文本中的行号；null 表示仅用于对齐，B 无此行 */
  rightLineNo: number | null
}

function annotateSourceLineNos(rows: AlignedLineRow[]): Array<
  AlignedLineRow & { leftLineNo: number | null; rightLineNo: number | null }
> {
  let nL = 1
  let nR = 1
  return rows.map((r) => {
    switch (r.kind) {
      case 'equal':
        return { ...r, leftLineNo: nL++, rightLineNo: nR++ }
      case 'delete':
        return { ...r, leftLineNo: nL++, rightLineNo: null }
      case 'insert':
        return { ...r, leftLineNo: null, rightLineNo: nR++ }
      case 'change':
        return { ...r, leftLineNo: nL++, rightLineNo: nR++ }
    }
  })
}

function charDiffToHtml(left: string, right: string): { leftHtml: string; rightHtml: string } {
  const parts = diffChars(left, right)
  let leftHtml = ''
  let rightHtml = ''
  for (const part of parts) {
    const esc = escapeHtml(part.value)
    if (part.added) {
      rightHtml += `<mark class="json-ld-chg json-ld-chg-add">${esc}</mark>`
    } else if (part.removed) {
      leftHtml += `<mark class="json-ld-chg json-ld-chg-del">${esc}</mark>`
    } else {
      leftHtml += esc
      rightHtml += esc
    }
  }
  return { leftHtml, rightHtml }
}

export function buildLineDiffViewRows(
  a: string,
  b: string,
  partialOpts?: Partial<TextDiffCompareOptions>
): {
  rows: LineDiffViewRow[]
  capped: boolean
} {
  let capped = false
  let raw = alignedLineDiff(a, b, partialOpts)
  if (raw.length > LINE_DIFF_MAX_ROWS) {
    raw = raw.slice(0, LINE_DIFF_MAX_ROWS)
    capped = true
  }

  const annotated = annotateSourceLineNos(raw)

  const rows: LineDiffViewRow[] = annotated.map((r) => {
    switch (r.kind) {
      case 'equal':
        return {
          leftHtml: escapeHtml(r.left),
          rightHtml: escapeHtml(r.right),
          kind: r.kind,
          markLeft: ' ',
          markRight: ' ',
          leftLineNo: r.leftLineNo,
          rightLineNo: r.rightLineNo
        }
      case 'delete':
        return {
          leftHtml: escapeHtml(r.left),
          rightHtml: '&#160;',
          kind: r.kind,
          markLeft: '-',
          markRight: ' ',
          leftLineNo: r.leftLineNo,
          rightLineNo: r.rightLineNo
        }
      case 'insert':
        return {
          leftHtml: '&#160;',
          rightHtml: escapeHtml(r.right),
          kind: r.kind,
          markLeft: ' ',
          markRight: '+',
          leftLineNo: r.leftLineNo,
          rightLineNo: r.rightLineNo
        }
      case 'change': {
        const { leftHtml, rightHtml } = charDiffToHtml(r.left, r.right)
        return {
          leftHtml,
          rightHtml,
          kind: r.kind,
          markLeft: ' ',
          markRight: ' ',
          leftLineNo: r.leftLineNo,
          rightLineNo: r.rightLineNo
        }
      }
    }
  })

  return { rows, capped }
}

export function lineDiffRowBg(kind: LineDiffKind): { left: string; right: string } {
  switch (kind) {
    case 'equal':
      return { left: '', right: '' }
    case 'delete':
      return { left: 'bg-rose-100/80', right: 'bg-slate-50/50' }
    case 'insert':
      return { left: 'bg-slate-50/50', right: 'bg-emerald-100/80' }
    case 'change':
      return { left: 'bg-rose-50/90', right: 'bg-emerald-50/90' }
  }
}
