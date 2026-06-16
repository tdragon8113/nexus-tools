import type { Options } from 'prettier'
import { formatCsv } from '~/utils/csvTool'
import { formatJsonSource } from '~/utils/jsonFormat'
import { textDiffLanguageLabel, type TextDiffLanguageId } from '~/utils/textDiffCodeMirrorLanguage'

const formattableLanguages = new Set<TextDiffLanguageId>([
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'markdown',
  'csv'
])

export function canFormatTextDiffLanguage(language: TextDiffLanguageId): boolean {
  return formattableLanguages.has(language)
}

export function formatActionLabel(language: TextDiffLanguageId): string {
  return `格式化为 ${textDiffLanguageLabel(language)}`
}

export function formatSideActionLabel(
  language: TextDiffLanguageId,
  side: 'left' | 'right'
): string {
  const pane = side === 'left' ? '左侧' : '右侧'
  return `将${pane}${formatActionLabel(language)}`
}

export function formatBothActionLabel(language: TextDiffLanguageId): string {
  return `将两侧${formatActionLabel(language)}`
}

function asPlugins(m: unknown): unknown[] {
  if (!m || typeof m !== 'object') return []
  return 'default' in m ? [(m as { default: unknown }).default] : [m]
}

export async function formatTextDiffSource(
  language: TextDiffLanguageId,
  source: string
): Promise<string> {
  if (!canFormatTextDiffLanguage(language)) {
    throw new Error('当前语言不支持格式化')
  }
  if (!source.trim()) return source

  if (language === 'csv') {
    return await formatCsv(source)
  }

  if (language === 'json') {
    return formatJsonSource(source)
  }

  const { format } = await import('prettier/standalone')
  const estree = await import('prettier/plugins/estree')
  const babel = await import('prettier/plugins/babel')
  const typescript = await import('prettier/plugins/typescript')
  const html = await import('prettier/plugins/html')
  const postcss = await import('prettier/plugins/postcss')
  const markdown = await import('prettier/plugins/markdown')

  const base: Options = {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 2
  }

  let parser: string
  let plugins: unknown[]

  switch (language) {
    case 'javascript':
      parser = 'babel'
      plugins = [...asPlugins(estree), ...asPlugins(babel)]
      break
    case 'typescript':
      parser = 'typescript'
      plugins = [...asPlugins(estree), ...asPlugins(typescript)]
      break
    case 'html':
      parser = 'html'
      plugins = [...asPlugins(html)]
      break
    case 'css':
      parser = 'css'
      plugins = [...asPlugins(postcss)]
      break
    case 'markdown':
      parser = 'markdown'
      plugins = [...asPlugins(markdown)]
      break
    default:
      throw new Error('当前语言不支持格式化')
  }

  return format(source, { ...base, parser, plugins })
}
