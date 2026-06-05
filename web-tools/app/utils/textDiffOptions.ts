import {
  getDesktopLocalStateValue,
  persistDesktopLocalStateKeyFireAndForget
} from '~/core/desktopLocalState'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

export type TextDiffCompareOptions = {
  /** 行尾空白不参与比较（展示仍为原文） */
  ignoreTrimWhitespace: boolean
  /** 行首/行尾空白差异不参与比较（传给 diffLines） */
  ignoreWhitespace: boolean
  /** 大小写不参与比较 */
  ignoreCase: boolean
  /** 双方均为空行时视为相同 */
  ignoreEmptyLines: boolean
}

export const defaultTextDiffCompareOptions = (): TextDiffCompareOptions => ({
  ignoreTrimWhitespace: false,
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreEmptyLines: false
})

export const TEXT_DIFF_OPTIONS_STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.textDiffOptions

export function normalizeLineForCompare(
  line: string,
  opts: TextDiffCompareOptions
): string {
  let s = line
  if (opts.ignoreTrimWhitespace) s = s.trimEnd()
  if (opts.ignoreCase) s = s.toLowerCase()
  return s
}

export function linesEqualForCompare(
  left: string,
  right: string,
  opts: TextDiffCompareOptions
): boolean {
  const l = normalizeLineForCompare(left, opts)
  const r = normalizeLineForCompare(right, opts)
  if (opts.ignoreEmptyLines && l === '' && r === '') return true
  return l === r
}

export function mergeTextDiffCompareOptions(
  partial?: Partial<TextDiffCompareOptions>
): TextDiffCompareOptions {
  return { ...defaultTextDiffCompareOptions(), ...partial }
}

export function hasActiveCompareOptions(opts: TextDiffCompareOptions): boolean {
  return (
    opts.ignoreTrimWhitespace ||
    opts.ignoreWhitespace ||
    opts.ignoreCase ||
    opts.ignoreEmptyLines
  )
}

export function compareOptionsStatusSuffix(opts: TextDiffCompareOptions): string {
  if (!hasActiveCompareOptions(opts)) return ''
  const parts: string[] = []
  if (opts.ignoreTrimWhitespace) parts.push('行尾空白')
  if (opts.ignoreWhitespace) parts.push('空白')
  if (opts.ignoreCase) parts.push('大小写')
  if (opts.ignoreEmptyLines) parts.push('空行')
  return `（已忽略 ${parts.join('、')}）`
}

export function loadTextDiffCompareOptionsFromStorage(): TextDiffCompareOptions | null {
  if (!import.meta.client) return null
  try {
    const raw = getDesktopLocalStateValue(TEXT_DIFF_OPTIONS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TextDiffCompareOptions>
    return mergeTextDiffCompareOptions(parsed)
  } catch {
    return null
  }
}

export function saveTextDiffCompareOptionsToStorage(opts: TextDiffCompareOptions): void {
  if (!import.meta.client) return
  persistDesktopLocalStateKeyFireAndForget(TEXT_DIFF_OPTIONS_STORAGE_KEY, JSON.stringify(opts))
}
