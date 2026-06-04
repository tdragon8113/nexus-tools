import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import type { DesktopThemeResolved } from '~/core/desktopTheme'

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

export const jsonHighlightStyleDark = HighlightStyle.define([
  { tag: t.propertyName, color: '#79c0ff', fontWeight: '600' },
  { tag: t.string, color: '#7ee787' },
  { tag: t.special(t.string), color: '#7ee787' },
  { tag: t.number, color: '#ffa657', fontWeight: '500' },
  { tag: t.integer, color: '#ffa657', fontWeight: '500' },
  { tag: t.float, color: '#ffa657', fontWeight: '500' },
  { tag: t.bool, color: '#d2a8ff', fontWeight: '600' },
  { tag: t.null, color: '#8b949e', fontStyle: 'italic' },
  { tag: t.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: [t.brace, t.bracket], color: '#c9d1d9', fontWeight: '600' },
  { tag: t.paren, color: '#c9d1d9' },
  { tag: t.separator, color: '#8b949e' },
  { tag: t.punctuation, color: '#8b949e' },
  { tag: t.invalid, color: '#ff7b72' }
])

export function jsonSyntaxHighlightForTheme(theme: DesktopThemeResolved) {
  const style = theme === 'dark' ? jsonHighlightStyleDark : jsonHighlightStyle
  return syntaxHighlighting(style, { fallback: true })
}

export const jsonSyntaxHighlightExtension = jsonSyntaxHighlightForTheme('light')
