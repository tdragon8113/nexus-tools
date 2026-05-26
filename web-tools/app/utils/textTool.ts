import { lineCountFor } from '~/utils/jsonTool'

export interface TextEditorStats {
  lines: number
  chars: number
  words: number
  bytes: number
}

export function textEditorStats(text: string): TextEditorStats {
  const trimmed = text.trim()
  return {
    lines: lineCountFor(text),
    chars: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    bytes: new TextEncoder().encode(text).length
  }
}

export function trimLineEnds(text: string): string {
  return text.split(/\r?\n/).map((line) => line.trimEnd()).join('\n')
}

export function removeEmptyLines(text: string): string {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).join('\n')
}

export function sortLines(text: string): string {
  const lines = text.split(/\r?\n/)
  return [...lines].sort((a, b) => a.localeCompare(b, 'zh')).join('\n')
}

export function dedupeLines(text: string): string {
  const seen = new Set<string>()
  return text
    .split(/\r?\n/)
    .filter((line) => {
      if (seen.has(line)) return false
      seen.add(line)
      return true
    })
    .join('\n')
}

export function reverseLines(text: string): string {
  return [...text.split(/\r?\n/)].reverse().join('\n')
}

export function normalizeLineEndings(text: string, style: 'lf' | 'crlf' = 'lf'): string {
  const lf = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return style === 'lf' ? lf : lf.replace(/\n/g, '\r\n')
}

export function transformCase(text: string, mode: 'upper' | 'lower' | 'title'): string {
  if (mode === 'upper') return text.toUpperCase()
  if (mode === 'lower') return text.toLowerCase()
  return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export interface ReplaceAllOptions {
  caseSensitive?: boolean
  useRegex?: boolean
}

export function replaceAllInText(
  text: string,
  find: string,
  replacement: string,
  options: ReplaceAllOptions = {}
): { text: string; count: number } {
  if (!find) return { text, count: 0 }

  if (options.useRegex) {
    try {
      const flags = options.caseSensitive ? 'g' : 'gi'
      const re = new RegExp(find, flags)
      let count = 0
      const next = text.replace(re, () => {
        count++
        return replacement
      })
      return { text: next, count }
    } catch {
      return { text, count: 0 }
    }
  }

  if (options.caseSensitive) {
    let count = 0
    let i = 0
    let out = ''
    while (i < text.length) {
      const idx = text.indexOf(find, i)
      if (idx === -1) {
        out += text.slice(i)
        break
      }
      count++
      out += text.slice(i, idx) + replacement
      i = idx + find.length
    }
    return { text: out, count }
  }

  const lower = text.toLowerCase()
  const needle = find.toLowerCase()
  let count = 0
  let i = 0
  let out = ''
  while (i < text.length) {
    const idx = lower.indexOf(needle, i)
    if (idx === -1) {
      out += text.slice(i)
      break
    }
    count++
    out += text.slice(i, idx) + replacement
    i = idx + find.length
  }
  return { text: out, count }
}
