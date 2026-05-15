import { diffChars, diffLines } from 'diff'

export const LINE_DIFF_MAX_ROWS = 12000

export type LineDiffKind = 'equal' | 'insert' | 'delete' | 'change'

export type AlignedLineRow = {
  left: string
  right: string
  kind: LineDiffKind
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 将 diffLines 的删/增块成对 zip，得到左右对齐的行（便于并排滚动）。
 */
export function alignedLineDiff(a: string, b: string): AlignedLineRow[] {
  const parts = diffLines(a, b, { ignoreWhitespace: false })
  const rows: AlignedLineRow[] = []

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const raw = p.value
    const endsWithNl = raw.endsWith('\n')
    const body = endsWithNl ? raw.slice(0, -1) : raw
    const lines = body.length === 0 && !endsWithNl ? [] : body.split('\n')

    if (p.removed) {
      const next = parts[i + 1]
      if (next?.added) {
        const nraw = next.value
        const nEnds = nraw.endsWith('\n')
        const nBody = nEnds ? nraw.slice(0, -1) : nraw
        const addLines = nBody.length === 0 && !nEnds ? [] : nBody.split('\n')
        const max = Math.max(lines.length, addLines.length)
        for (let k = 0; k < max; k++) {
          const L = lines[k] ?? ''
          const R = addLines[k] ?? ''
          rows.push({
            left: L,
            right: R,
            kind: L === R ? 'equal' : 'change'
          })
        }
        i++
      } else {
        for (const line of lines) {
          rows.push({ left: line, right: '', kind: 'delete' })
        }
      }
    } else if (p.added) {
      for (const line of lines) {
        rows.push({ left: '', right: line, kind: 'insert' })
      }
    } else {
      for (const line of lines) {
        rows.push({ left: line, right: line, kind: 'equal' })
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

export function buildLineDiffViewRows(a: string, b: string): {
  rows: LineDiffViewRow[]
  capped: boolean
} {
  let capped = false
  let raw = alignedLineDiff(a, b)
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
