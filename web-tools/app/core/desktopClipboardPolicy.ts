import {
  detectClipboardContentHint,
  detectContentHint,
  formatSearchPayloadSize,
  looksLikePlainDocument
} from '~/core/search'

export type ClipboardPolicy = 'smart' | 'always' | 'never'

export type ClipboardOpenSource = 'hotkey' | 'navigation'

export type ClipboardIngestDecision =
  | { action: 'ignore' }
  | { action: 'autofill' }
  | { action: 'hint' }

export function hashClipboardText(text: string): string {
  const t = text.trim()
  let h = 0
  for (let i = 0; i < t.length; i++) {
    h = (Math.imul(31, h) + t.charCodeAt(i)) | 0
  }
  return `${t.length}:${h >>> 0}`
}

/** 智能模式：有明确工具意图时自动填入，否则仅提示 */
export function clipboardLooksAutoFillable(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (detectContentHint(t)) return true
  if (looksLikePlainDocument(t)) return false
  if (t.length <= 240 && !/\s{2,}/.test(t)) return true
  return false
}

export function summarizeClipboardOffer(text: string): string {
  const t = text.trim()
  if (!t) return '剪贴板'
  const sample = t.length > 4000 ? t.slice(0, 4000) : t
  const hint = detectClipboardContentHint(sample)
  if (hint) return hint.label
  if (t.length > 80) return `文本 · ${formatSearchPayloadSize(t)}`
  const oneLine = t.replace(/\s+/g, ' ')
  return oneLine.length > 48 ? `${oneLine.slice(0, 48)}…` : oneLine
}

export function decideClipboardIngest(opts: {
  policy: ClipboardPolicy
  source: ClipboardOpenSource
  text: string
  lastAppliedHash: string
  dismissedHash: string
  /** 搜索 Query 已有内容时，与剪贴板相同则不再填入/提示 */
  existingQueryText?: string
}): ClipboardIngestDecision {
  const text = opts.text.trim()
  if (!text || opts.source !== 'hotkey') return { action: 'ignore' }
  if (opts.policy === 'never') return { action: 'ignore' }

  const hash = hashClipboardText(text)
  const existing = opts.existingQueryText?.trim()
  if (existing && hashClipboardText(existing) === hash) return { action: 'ignore' }
  if (hash === opts.dismissedHash) return { action: 'ignore' }
  if (hash === opts.lastAppliedHash) return { action: 'ignore' }

  if (opts.policy === 'always') return { action: 'autofill' }

  if (clipboardLooksAutoFillable(text)) return { action: 'autofill' }
  return { action: 'hint' }
}
