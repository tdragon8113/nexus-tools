import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { jsonSyntaxHighlightExtension } from '~/utils/jsonCodeMirrorHighlight'
import type { TextDiffLanguageId } from '~/utils/textDiffCodeMirrorLanguage'
import type { Extension } from '@codemirror/state'

/** 通用代码/标记语言高亮（JS、Python、SQL、HTML 等共用 Lezer 标签） */
const codeHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#8250df', fontWeight: '600' },
  { tag: [t.modifier, t.controlKeyword, t.moduleKeyword], color: '#8250df', fontWeight: '600' },
  { tag: [t.definition(t.name), t.definition(t.propertyName)], color: '#0550ae', fontWeight: '600' },
  { tag: t.propertyName, color: '#0550ae', fontWeight: '600' },
  { tag: [t.variableName, t.attributeName], color: '#953800' },
  { tag: [t.typeName, t.className, t.namespace, t.labelName], color: '#8250df' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#8250df' },
  { tag: [t.tagName], color: '#116329' },
  { tag: t.number, color: '#bc4c00', fontWeight: '500' },
  { tag: t.integer, color: '#bc4c00', fontWeight: '500' },
  { tag: t.float, color: '#bc4c00', fontWeight: '500' },
  { tag: t.bool, color: '#8250df', fontWeight: '600' },
  { tag: t.null, color: '#6e7781', fontStyle: 'italic' },
  { tag: t.string, color: '#0a6f4a' },
  { tag: t.special(t.string), color: '#0a6f4a' },
  { tag: t.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: [t.meta, t.documentMeta, t.annotation], color: '#6e7781' },
  { tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4], color: '#0550ae', fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#57606a' },
  { tag: t.strong, fontWeight: '700' },
  { tag: [t.link, t.url], color: '#0969da' },
  { tag: t.monospace, color: '#0a6f4a', fontFamily: 'var(--font-mono, ui-monospace, monospace)' },
  { tag: t.processingInstruction, color: '#6e7781' },
  { tag: [t.brace, t.bracket], color: '#57606a', fontWeight: '600' },
  { tag: t.paren, color: '#57606a' },
  { tag: [t.separator, t.punctuation, t.operator], color: '#8b949e' },
  { tag: t.invalid, color: '#cf222e', textDecoration: 'underline wavy' }
])

export const codeSyntaxHighlightExtension = syntaxHighlighting(codeHighlightStyle, { fallback: true })

/** 按语法下拉选项返回高亮扩展；纯文本不着色 */
export function textEditorHighlightForLanguage(id: TextDiffLanguageId): Extension {
  if (id === 'plain') return []
  if (id === 'json') return jsonSyntaxHighlightExtension
  return codeSyntaxHighlightExtension
}
