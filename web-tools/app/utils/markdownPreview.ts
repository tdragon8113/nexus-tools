import type MarkdownIt from 'markdown-it'

let md: MarkdownIt | null = null

async function getMarkdownIt(): Promise<MarkdownIt> {
  if (md) return md
  const { default: MarkdownItCtor } = await import('markdown-it')
  md = new MarkdownItCtor({ html: true, linkify: true, breaks: true })
  return md
}

/** 去掉脚本、事件属性等危险片段（本地工具场景下的轻量净化） */
export function sanitizeMarkdownHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s(on\w+|style)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
}

/** 将 Markdown / 内联 HTML 转为可预览的 HTML */
export async function renderMarkdownToHtml(source: string): Promise<string> {
  const parser = await getMarkdownIt()
  return sanitizeMarkdownHtml(parser.render(source))
}
