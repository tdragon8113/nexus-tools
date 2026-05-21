import type { Options } from 'prettier'
import type { TextDiffLanguageId } from '~/utils/textDiffCodeMirrorLanguage'

const formattableLanguages = new Set<TextDiffLanguageId>([
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'markdown'
])

export function canFormatTextDiffLanguage(language: TextDiffLanguageId): boolean {
  return formattableLanguages.has(language)
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
    case 'json':
      parser = 'json'
      plugins = [...asPlugins(estree), ...asPlugins(babel)]
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
