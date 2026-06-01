export interface SummaryFormatAction {
  id: 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'divider'
  symbol: string
  title: string
}

export const SUMMARY_FORMAT_ACTIONS: SummaryFormatAction[] = [
  { id: 'bold', symbol: 'B', title: '重点' },
  { id: 'italic', symbol: 'I', title: '斜体' },
  { id: 'heading', symbol: 'H', title: '标题' },
  { id: 'list', symbol: '≡', title: '列表' },
  { id: 'quote', symbol: '❝', title: '引用' },
  { id: 'divider', symbol: '—', title: '分隔' }
]

function escapeHtml (text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function stripMarkdown (source: string) {
  return source
    .replace(/^##+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^-\s+/gm, '')
    .replace(/^---$/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export function renderSimpleMarkdown (source: string) {
  if (!source.trim()) return ''

  const lines = source.split('\n')
  const htmlParts: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      htmlParts.push('</ul>')
      inList = false
    }
  }

  const inlineFormat = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.trim() === '---') {
      closeList()
      htmlParts.push('<hr class="rich-hr" />')
      continue
    }

    if (line.startsWith('## ')) {
      closeList()
      htmlParts.push(`<p class="rich-heading">${inlineFormat(line.slice(3))}</p>`)
      continue
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        htmlParts.push('<ul class="rich-list">')
        inList = true
      }
      htmlParts.push(`<li>${inlineFormat(line.slice(2))}</li>`)
      continue
    }

    if (line.startsWith('> ')) {
      closeList()
      htmlParts.push(`<blockquote class="rich-quote">${inlineFormat(line.slice(2))}</blockquote>`)
      continue
    }

    closeList()
    if (line.trim()) {
      htmlParts.push(`<p class="rich-p">${inlineFormat(line)}</p>`)
    }
  }

  closeList()
  return htmlParts.join('')
}

function inlineMarkdownFromNode (el: HTMLElement): string {
  let result = ''
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? ''
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const child = node as HTMLElement
    const tag = child.tagName.toLowerCase()
    const inner = inlineMarkdownFromNode(child)
    if (tag === 'strong' || tag === 'b') {
      result += inner ? `**${inner}**` : ''
    } else if (tag === 'em' || tag === 'i') {
      result += inner ? `*${inner}*` : ''
    } else if (tag === 'br') {
      result += '\n'
    } else {
      result += inner
    }
  }
  return result
}

export function htmlToSimpleMarkdown (html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks: string[] = []

  for (const node of doc.body.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (text) blocks.push(text)
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'hr') {
      blocks.push('---')
      continue
    }

    if (tag === 'ul' || tag === 'ol') {
      for (const li of el.querySelectorAll(':scope > li')) {
        const text = inlineMarkdownFromNode(li as HTMLElement).trim()
        if (text) blocks.push(`- ${text}`)
      }
      continue
    }

    if (tag === 'blockquote') {
      const text = inlineMarkdownFromNode(el).trim()
      if (text) blocks.push(`> ${text}`)
      continue
    }

    if (tag === 'h2' || tag === 'h3' || el.classList.contains('rich-heading')) {
      const text = inlineMarkdownFromNode(el).trim()
      if (text) blocks.push(`## ${text}`)
      continue
    }

    if (tag === 'p' || tag === 'div') {
      const text = inlineMarkdownFromNode(el).trim()
      if (text) blocks.push(text)
    }
  }

  return blocks.join('\n').trim()
}

export function markdownToEditableHtml (source: string) {
  const rendered = renderSimpleMarkdown(source.trim())
  return rendered || '<p><br></p>'
}

export function isEditableEmpty (html: string) {
  return !htmlToSimpleMarkdown(html)
}

export type SummaryFormatId = SummaryFormatAction['id']

export function detectActiveFormats (editorRoot: HTMLElement | null): Set<SummaryFormatId> {
  const active = new Set<SummaryFormatId>()
  if (!editorRoot) return active

  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0) return active

  const range = selection.getRangeAt(0)
  if (!editorRoot.contains(range.commonAncestorContainer)) return active

  try {
    if (document.queryCommandState('bold')) active.add('bold')
    if (document.queryCommandState('italic')) active.add('italic')
    if (document.queryCommandState('insertUnorderedList')) active.add('list')
  } catch {
    // queryCommandState may fail outside focused edit context
  }

  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode

  while (node && node !== editorRoot) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode
      continue
    }
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'h2' || tag === 'h3' || el.classList.contains('rich-heading')) {
      active.add('heading')
    }
    if (tag === 'blockquote') active.add('quote')
    if (tag === 'hr') active.add('divider')
    node = node.parentNode
  }

  return active
}
