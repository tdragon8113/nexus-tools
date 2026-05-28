import { createPatch } from 'diff'
import { alignedLineDiff } from '~/utils/jsonLineDiffView'
import { mergeTextDiffCompareOptions, normalizeLineForCompare, type TextDiffCompareOptions } from '~/utils/textDiffOptions'

export type BuildUnifiedDiffParams = {
  left: string
  right: string
  leftLabel?: string
  rightLabel?: string
  compareOptions?: Partial<TextDiffCompareOptions>
}

function textToLines(text: string): string[] {
  if (text === '') return []
  const endsWithNl = text.endsWith('\n')
  const body = endsWithNl ? text.slice(0, -1) : text
  if (body.length === 0 && !endsWithNl) return []
  return body.split('\n')
}

/** 按对比选项规范化整段文本（用于 unified patch） */
export function normalizeTextForDiff(text: string, opts: TextDiffCompareOptions): string {
  let lines = textToLines(text)
  if (opts.ignoreEmptyLines) {
    lines = lines.filter((line) => line.trim() !== '')
  }
  return lines.map((line) => normalizeLineForCompare(line, opts)).join('\n')
}

export function hasTextDiff(
  left: string,
  right: string,
  partialOpts?: Partial<TextDiffCompareOptions>
): boolean {
  return alignedLineDiff(left, right, partialOpts).some((row) => row.kind !== 'equal')
}

export function buildUnifiedDiffPatch(params: BuildUnifiedDiffParams): string {
  if (!hasTextDiff(params.left, params.right, params.compareOptions)) return ''

  const opts = mergeTextDiffCompareOptions(params.compareOptions)
  const leftNorm = normalizeTextForDiff(params.left, opts)
  const rightNorm = normalizeTextForDiff(params.right, opts)

  return createPatch(
    'original',
    leftNorm,
    rightNorm,
    params.leftLabel ?? '原始',
    params.rightLabel ?? '对比',
    { context: 3 }
  )
}
