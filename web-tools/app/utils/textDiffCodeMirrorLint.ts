import { syntaxTree } from '@codemirror/language'
import { linter, type Diagnostic, type LintSource } from '@codemirror/lint'
import type { Extension } from '@codemirror/state'
import { jsonLintSource } from '~/utils/jsonCodeMirrorLint'
import { CsvParseError, lintCsv, parseCsv } from '~/utils/csvTool'
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

function csvLintSource(): LintSource {
  return (view) => {
    const text = view.state.doc.toString()
    if (!text.trim()) return []

    try {
      parseCsv(text)
    } catch (e) {
      const line = e instanceof CsvParseError ? e.line : 1
      const lineStart = line <= 1 ? 0 : view.state.doc.line(line).from
      const lineEnd = view.state.doc.line(Math.min(line, view.state.doc.lines)).to
      return [
        {
          from: lineStart,
          to: Math.max(lineStart + 1, lineEnd),
          severity: 'error',
          message: e instanceof Error ? e.message : 'CSV 解析失败',
          source: 'csv'
        }
      ]
    }

    const issues = lintCsv(text)
    return issues.map((issue) => {
      const lineNo = Math.min(Math.max(issue.line, 1), view.state.doc.lines)
      const line = view.state.doc.line(lineNo)
      return {
        from: line.from,
        to: line.to,
        severity: 'warning' as const,
        message: issue.message,
        source: 'csv'
      }
    })
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
  if (language === 'csv') return wrapLint(csvLintSource(), 350)
  if (lezerLintLanguages.has(language)) {
    return wrapLint(lezerSyntaxLintSource(lezerLintMessages[language] ?? '语法错误'))
  }
  return null
}
