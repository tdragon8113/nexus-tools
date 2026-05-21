import { syntaxTree } from '@codemirror/language'
import { linter, type Diagnostic, type LintSource } from '@codemirror/lint'
import type { Extension } from '@codemirror/state'
import { parseJson } from '~/utils/jsonTool'
import type { TextDiffLanguageId } from '~/utils/textDiffCodeMirrorLanguage'

function mergeDiagnostics(diags: Diagnostic[]): Diagnostic[] {
  if (diags.length <= 1) return diags
  const sorted = [...diags].sort((a, b) => a.from - b.from)
  const merged: Diagnostic[] = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    const cur = sorted[i]
    if (cur.from <= last.to) {
      last.to = Math.max(last.to, cur.to)
      if (cur.message && cur.message !== last.message) {
        last.message = `${last.message}；${cur.message}`
      }
    } else {
      merged.push({ ...cur })
    }
  }
  return merged
}

function lezerSyntaxLintSource(message = '语法错误'): LintSource {
  return (view) => {
    const diags: Diagnostic[] = []
    syntaxTree(view.state).iterate({
      enter(node) {
        if (node.type.isError) {
          diags.push({
            from: node.from,
            to: Math.max(node.to, node.from + 1),
            severity: 'error',
            message
          })
        }
      }
    })
    return mergeDiagnostics(diags)
  }
}

function jsonLintSource(): LintSource {
  return (view) => {
    const text = view.state.doc.toString()
    if (!text.trim()) return []
    const result = parseJson(text)
    if (result.ok) return []
    const docLen = view.state.doc.length
    const from =
      result.errorIndexInRaw != null
        ? Math.min(Math.max(result.errorIndexInRaw, 0), docLen)
        : 0
    const to = Math.min(from + 1, docLen)
    return [
      {
        from,
        to: to > from ? to : from,
        severity: 'error',
        message: result.message,
        source: 'json'
      }
    ]
  }
}

function xmlLintSource(): LintSource {
  return (view) => {
    const text = view.state.doc.toString()
    if (!text.trim()) return []
    const doc = new DOMParser().parseFromString(text, 'application/xml')
    const err = doc.querySelector('parsererror')
    if (!err) return []
    const message = err.textContent?.trim().replace(/\s+/g, ' ') || 'XML 解析失败'
    return [
      {
        from: 0,
        to: Math.min(view.state.doc.length, 1),
        severity: 'error',
        message,
        source: 'xml'
      }
    ]
  }
}

function wrapLint(source: LintSource, delay = 400): Extension {
  return linter(source, { delay })
}

const lezerLintLanguages = new Set<TextDiffLanguageId>([
  'javascript',
  'typescript',
  'html',
  'css',
  'markdown',
  'python',
  'sql',
  'yaml'
])

const lezerLintMessages: Partial<Record<TextDiffLanguageId, string>> = {
  javascript: 'JavaScript 语法错误',
  typescript: 'TypeScript 语法错误',
  html: 'HTML 语法错误',
  css: 'CSS 语法错误',
  markdown: 'Markdown 语法错误',
  python: 'Python 语法错误',
  sql: 'SQL 语法错误',
  yaml: 'YAML 语法错误'
}

export function loadTextDiffLint(language: TextDiffLanguageId): Extension | null {
  if (language === 'plain') return null
  if (language === 'json') return wrapLint(jsonLintSource(), 350)
  if (language === 'xml') return wrapLint(xmlLintSource(), 400)
  if (lezerLintLanguages.has(language)) {
    return wrapLint(lezerSyntaxLintSource(lezerLintMessages[language] ?? '语法错误'))
  }
  return null
}
