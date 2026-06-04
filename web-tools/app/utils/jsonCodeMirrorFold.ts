import { codeFolding } from '@codemirror/language'
import type { EditorState } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

type FoldKind = 'array' | 'object' | 'unknown'

type FoldSummary = {
  kind: FoldKind
  count: number
}

function detectContainerKind(doc: string, from: number, to: number): FoldKind {
  const open = from > 0 ? doc[from - 1] : ''
  const close = to < doc.length ? doc[to] : ''
  if (open === '[' && close === ']') return 'array'
  if (open === '{' && close === '}') return 'object'
  return 'unknown'
}

/** 在字符串深度 0 上数逗号分隔的顶层元素个数 */
function countTopLevelItems(inner: string, kind: FoldKind): number {
  const s = inner.trim()
  if (!s) return 0

  let depth = 0
  let inString = false
  let escape = false
  let items = 1

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '[' || ch === '{') depth++
    else if (ch === ']' || ch === '}') depth = Math.max(0, depth - 1)
    else if (ch === ',' && depth === 0) items++
  }

  return items
}

function summarizeFoldedRange(state: EditorState, range: { from: number; to: number }): FoldSummary {
  const doc = state.doc.toString()
  const kind = detectContainerKind(doc, range.from, range.to)
  const inner = state.doc.sliceString(range.from, range.to)

  if (kind === 'unknown') {
    const lines = inner.split(/\r?\n/).filter((line) => line.trim()).length
    return { kind, count: lines }
  }

  const wrapped =
    kind === 'array' ? `[${inner}]` : kind === 'object' ? `{${inner}}` : inner

  try {
    const parsed = JSON.parse(wrapped) as unknown
    if (kind === 'array' && Array.isArray(parsed)) {
      return { kind, count: parsed.length }
    }
    if (kind === 'object' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { kind, count: Object.keys(parsed as object).length }
    }
  } catch {
    /* 编辑中可能暂时无法 parse，走启发式 */
  }

  return { kind, count: countTopLevelItems(inner, kind) }
}

function encodeFoldSummary(summary: FoldSummary): string {
  return `${summary.kind}:${summary.count}`
}

function decodeFoldSummary(prepared: unknown): FoldSummary | null {
  if (typeof prepared !== 'string') return null
  const idx = prepared.indexOf(':')
  if (idx < 0) return null
  const kind = prepared.slice(0, idx) as FoldKind
  const count = Number(prepared.slice(idx + 1))
  if (!Number.isFinite(count)) return null
  if (kind !== 'array' && kind !== 'object' && kind !== 'unknown') return null
  return { kind, count: Math.max(0, Math.floor(count)) }
}

function foldPlaceholderLabel(summary: FoldSummary): string {
  if (summary.kind === 'array') {
    if (summary.count === 0) return '··· 空数组'
    return `··· ${summary.count} 项`
  }
  if (summary.kind === 'object') {
    if (summary.count === 0) return '··· 空对象'
    return `··· ${summary.count} 个字段`
  }
  if (summary.count === 0) return '···'
  return `··· ${summary.count} 行`
}

function jsonFoldPlaceholderDOM(
  view: EditorView,
  onclick: (event: Event) => void,
  prepared: unknown
): HTMLElement {
  const summary = decodeFoldSummary(prepared) ?? { kind: 'unknown' as const, count: 0 }
  const el = document.createElement('span')
  el.className = 'cm-foldPlaceholder json-cm-fold-placeholder'
  el.textContent = foldPlaceholderLabel(summary)
  el.title = view.state.phrase('unfold')
  el.setAttribute('aria-label', view.state.phrase('folded code'))
  el.onclick = onclick
  return el
}

/** 自定义折叠占位（排在 foldGutter 之后，合并 fold 配置） */
export const jsonFoldPlaceholderExtension = codeFolding({
  preparePlaceholder: (state, range) => encodeFoldSummary(summarizeFoldedRange(state, range)),
  placeholderDOM: jsonFoldPlaceholderDOM
})
