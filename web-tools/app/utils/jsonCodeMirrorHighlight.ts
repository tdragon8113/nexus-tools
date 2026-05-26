import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/** JSON 语义高亮：键 / 字符串 / 数字 / 布尔 / null / 标点分层配色 */
export const jsonHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: '#0550ae', fontWeight: '600' },
  { tag: t.string, color: '#0a6f4a' },
  { tag: t.special(t.string), color: '#0a6f4a' },
  { tag: t.number, color: '#bc4c00', fontWeight: '500' },
  { tag: t.integer, color: '#bc4c00', fontWeight: '500' },
  { tag: t.float, color: '#bc4c00', fontWeight: '500' },
  { tag: t.bool, color: '#8250df', fontWeight: '600' },
  { tag: t.null, color: '#6e7781', fontStyle: 'italic' },
  { tag: t.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: [t.brace, t.bracket], color: '#57606a', fontWeight: '600' },
  { tag: t.paren, color: '#57606a' },
  { tag: t.separator, color: '#8b949e' },
  { tag: t.punctuation, color: '#8b949e' },
  { tag: t.invalid, color: '#cf222e' }
])

export const jsonSyntaxHighlightExtension = syntaxHighlighting(jsonHighlightStyle, {
  fallback: true
})
