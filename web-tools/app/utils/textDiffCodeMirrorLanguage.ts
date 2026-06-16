import type { Extension } from '@codemirror/state'
import { loadTextDiffLint } from '~/utils/textDiffCodeMirrorLint'
import { textEditorHighlightForLanguage } from '~/utils/textEditorCodeMirrorHighlight'

export interface TextDiffLanguageBundle {
  language: Extension
  lint: Extension | null
  highlight: Extension
}

export type TextDiffLanguageId =
  | 'plain'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'markdown'
  | 'python'
  | 'sql'
  | 'xml'
  | 'yaml'
  | 'csv'

export const textDiffLanguages: { id: TextDiffLanguageId; label: string }[] = [
  { id: 'plain', label: '纯文本' },
  { id: 'json', label: 'JSON' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'csv', label: 'CSV' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'xml', label: 'XML' },
  { id: 'yaml', label: 'YAML' }
]

export function isTextDiffLanguageId(value: string): value is TextDiffLanguageId {
  return textDiffLanguages.some((item) => item.id === value)
}

export function textDiffLanguageLabel(id: TextDiffLanguageId): string {
  return textDiffLanguages.find((item) => item.id === id)?.label ?? '纯文本'
}

async function loadTextDiffLanguageSupport(id: TextDiffLanguageId): Promise<Extension> {
  switch (id) {
    case 'plain':
      return []
    case 'json': {
      const { json } = await import('@codemirror/lang-json')
      return json()
    }
    case 'javascript': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript()
    }
    case 'typescript': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ typescript: true })
    }
    case 'html': {
      const { html } = await import('@codemirror/lang-html')
      return html()
    }
    case 'css': {
      const { css } = await import('@codemirror/lang-css')
      return css()
    }
    case 'markdown': {
      const { markdown } = await import('@codemirror/lang-markdown')
      return markdown()
    }
    case 'python': {
      const { python } = await import('@codemirror/lang-python')
      return python()
    }
    case 'sql': {
      const { sql } = await import('@codemirror/lang-sql')
      return sql()
    }
    case 'xml': {
      const { xml } = await import('@codemirror/lang-xml')
      return xml()
    }
    case 'yaml': {
      const { yaml } = await import('@codemirror/lang-yaml')
      return yaml()
    }
    case 'csv': {
      const { csvLanguageSupport } = await import('~/utils/csvCodeMirror')
      return csvLanguageSupport()
    }
    default:
      return []
  }
}

export async function loadTextDiffLanguageBundle(id: TextDiffLanguageId): Promise<TextDiffLanguageBundle> {
  const [language, lint] = await Promise.all([loadTextDiffLanguageSupport(id), Promise.resolve(loadTextDiffLint(id))])
  return { language, lint, highlight: textEditorHighlightForLanguage(id) }
}

/** @deprecated 使用 loadTextDiffLanguageBundle */
export async function loadTextDiffLanguage(id: TextDiffLanguageId): Promise<Extension> {
  return (await loadTextDiffLanguageBundle(id)).language
}
