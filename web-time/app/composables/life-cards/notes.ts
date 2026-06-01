import { parseTagsLine } from '~/composables/useRecordTags'

export type FeelingRating = 1 | 2 | 3 | 4 | 5

export const FEELING_LEVELS: ReadonlyArray<{ rating: FeelingRating; emoji: string; label: string }> = [
  { rating: 1, emoji: '😞', label: '很低落' },
  { rating: 2, emoji: '😕', label: '不太好' },
  { rating: 3, emoji: '😐', label: '一般' },
  { rating: 4, emoji: '🙂', label: '挺好' },
  { rating: 5, emoji: '🤩', label: '很棒' }
]

export interface ParsedRecordNotes {
  summary?: string
  feelingRating?: FeelingRating
  feelingText?: string
  tags?: string[]
}

export function encodeCardMarker (parentId: string, childId?: string) {
  return childId ? `[${parentId}/${childId}]` : `[${parentId}]`
}

export function decodeCardMarker (notes: string | null): { parentId: string; childId?: string } | null {
  if (!notes) return null
  const match = notes.match(/^\[([^/\]]+)(?:\/([^\]]+))?\]/)
  if (!match) return null
  return { parentId: match[1], childId: match[2] }
}

export function getFeelingLevel (rating: FeelingRating) {
  return FEELING_LEVELS[rating - 1]
}

export function formatFeelingDisplay (parsed: ParsedRecordNotes) {
  if (parsed.feelingRating) {
    const level = getFeelingLevel(parsed.feelingRating)
    const stars = '★'.repeat(parsed.feelingRating) + '☆'.repeat(5 - parsed.feelingRating)
    return `${level.emoji} ${stars} ${level.label}`
  }
  if (parsed.feelingText) return parsed.feelingText
  return ''
}

export function buildRecordNotes (
  parentId: string,
  childId: string | undefined,
  summary: string,
  feelingRating: FeelingRating | 0,
  tags: string[] = []
) {
  let notes = encodeCardMarker(parentId, childId)
  const s = summary.trim()
  if (s) notes += `\n总结：${s}`
  if (feelingRating >= 1 && feelingRating <= 5) notes += `\n感受：${feelingRating}`
  const normalizedTags = [...new Set(tags.map(t => t.trim()).filter(Boolean))]
  if (normalizedTags.length > 0) notes += `\n标签：${normalizedTags.join(',')}`
  return notes
}

export function activityHasTag (notes: string | null, tag: string) {
  return parseRecordNotes(notes).tags?.includes(tag) ?? false
}

export function parseRecordNotes (notes: string | null): ParsedRecordNotes {
  if (!notes) return {}
  const body = notes.replace(/^\[[^\]]+\]\n?/, '')
  if (!body) return {}

  let summary: string | undefined
  let feelingRating: FeelingRating | undefined
  let feelingText: string | undefined
  const tags: string[] = []

  const isFieldLine = (line: string) =>
    line.startsWith('感受：')
    || line.startsWith('标签：')
    || line.startsWith('特殊记忆：')

  const lines = body.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('总结：')) {
      const chunks: string[] = []
      const first = line.slice(3)
      if (first) chunks.push(first)
      i += 1
      while (i < lines.length && !isFieldLine(lines[i])) {
        chunks.push(lines[i])
        i += 1
      }
      const joined = chunks.join('\n').trim()
      if (joined) summary = joined
      continue
    }

    if (line.startsWith('感受：')) {
      const val = line.slice(3).trim()
      const num = Number.parseInt(val, 10)
      if (num >= 1 && num <= 5) {
        feelingRating = num as FeelingRating
      } else if (val) {
        feelingText = val
      }
    }

    if (line.startsWith('标签：')) {
      tags.push(...parseTagsLine(line.slice(3)))
    }

    if (line.startsWith('特殊记忆：')) {
      const val = line.slice(5).trim()
      if (val === '1' || val === 'true') tags.push('特殊记忆')
    }

    i += 1
  }

  const uniqueTags = [...new Set(tags)]
  return {
    summary,
    feelingRating,
    feelingText,
    tags: uniqueTags.length > 0 ? uniqueTags : undefined
  }
}
