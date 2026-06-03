import { showApiError } from '~/composables/useApiToast'
import { lifeCardsToApiPayload } from './api-types'
import {
  apiToLifeCards,
  type LifeCard,
  type LifeCardChild
} from './presentation'

export type { LifeCard, LifeCardChild, LifeCardColor } from './presentation'
export {
  LIFE_CARD_COLORS,
  apiToLifeCards
} from './presentation'

export type {
  FeelingRating,
  ParsedRecordNotes
} from './notes'

import {
  parseRecordNotes,
  decodeCardMarker,
  encodeCardMarker
} from './notes'

export {
  FEELING_LEVELS,
  encodeCardMarker,
  decodeCardMarker,
  getFeelingLevel,
  formatFeelingDisplay,
  buildRecordNotes,
  activityHasTag,
  parseRecordNotes,
  recordNeedsSummary
} from './notes'

export function collectAllTags (notesList: Array<string | null>) {
  const set = new Set<string>()
  for (const notes of notesList) {
    for (const tag of parseRecordNotes(notes).tags ?? []) {
      set.add(tag)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export interface LifeCardPick {
  parentId: string
  childId?: string
}

const LAST_LIFE_PICK_KEY = 'nexus_last_life_pick'

export function encodeLifePickValue (parentId: string, childId?: string) {
  if (childId === '__other__') return `${parentId}/__other__`
  return childId ? `${parentId}/${childId}` : parentId
}

export function decodeLifePickValue (value: string): LifeCardPick | null {
  if (!value) return null
  if (!value.includes('/')) return { parentId: value }
  const [parentId, childId] = value.split('/')
  if (!parentId) return null
  if (!childId || childId === '__other__') return { parentId }
  return { parentId, childId }
}

export function readLastLifePick (): LifeCardPick | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LAST_LIFE_PICK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LifeCardPick
    return parsed?.parentId ? parsed : null
  } catch {
    return null
  }
}

export function writeLastLifePick (pick: LifeCardPick) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_LIFE_PICK_KEY, JSON.stringify(pick))
}

export function formatLifePickInput (parentLabel: string, childLabel?: string) {
  const parent = parentLabel.trim()
  if (!parent) return ''
  const child = childLabel?.trim()
  return child ? `${parent} · ${child}` : parent
}

export function parseLifePickInput (raw: string) {
  const text = raw.trim()
  if (!text) return null
  const sep = text.includes('·') ? '·' : (text.includes('/') ? '/' : null)
  if (!sep) return { parentLabel: text }
  const [parentLabel, childLabel] = text.split(sep).map(s => s.trim())
  if (!parentLabel) return null
  return childLabel ? { parentLabel, childLabel } : { parentLabel }
}

export interface LifePickSearchItem {
  pick: LifeCardPick
  input: string
  parentLabel: string
  childLabel?: string
}

export function buildLifePickSearchItems (cards: LifeCard[]): LifePickSearchItem[] {
  const items: LifePickSearchItem[] = []
  for (const parent of cards) {
    if (!parent.children.length) {
      items.push({
        pick: { parentId: parent.id },
        input: formatLifePickInput(parent.label),
        parentLabel: parent.label
      })
      continue
    }
    for (const child of parent.children) {
      items.push({
        pick: { parentId: parent.id, childId: child.id },
        input: formatLifePickInput(parent.label, child.label),
        parentLabel: parent.label,
        childLabel: child.label
      })
    }
  }
  return items
}

export function searchLifePickItems (cards: LifeCard[], query: string, limit = 8) {
  const q = query.trim().toLowerCase()
  if (!q) return buildLifePickSearchItems(cards).slice(0, limit)
  return buildLifePickSearchItems(cards)
    .filter(item =>
      item.input.toLowerCase().includes(q)
      || item.parentLabel.toLowerCase().includes(q)
      || item.childLabel?.toLowerCase().includes(q)
    )
    .slice(0, limit)
}

export function buildLifePickOptions (cards: LifeCard[]) {
  const options: Array<{ text: string, value: string }> = []
  for (const parent of cards) {
    if (!parent.children.length) {
      options.push({
        text: parent.label,
        value: encodeLifePickValue(parent.id)
      })
      continue
    }
    for (const child of parent.children) {
      options.push({
        text: `${parent.label} · ${child.label}`,
        value: encodeLifePickValue(parent.id, child.id)
      })
    }
    options.push({
      text: `${parent.label} · 其他`,
      value: encodeLifePickValue(parent.id, '__other__')
    })
  }
  return options
}

export function getDefaultLifePick (cards: LifeCard[]): LifeCardPick | null {
  const options = buildLifePickOptions(cards)
  if (options.length === 0) return null

  const last = readLastLifePick()
  if (last) {
    const value = lifePickToValue(last, cards)
    if (options.some(option => option.value === value)) return last
    const parent = cards.find(card => card.id === last.parentId)
    if (parent && !parent.children.length) return { parentId: parent.id }
  }

  return decodeLifePickValue(options[0]!.value)
}

export function lifePickToValue (pick: LifeCardPick, cards: LifeCard[]) {
  const parent = cards.find(card => card.id === pick.parentId)
  if (pick.childId) return encodeLifePickValue(pick.parentId, pick.childId)
  if (parent?.children.length) return encodeLifePickValue(pick.parentId, '__other__')
  return encodeLifePickValue(pick.parentId)
}

export function useLifeCards () {
  const cards = useState<LifeCard[]>('lifeCards', () => [])
  const loading = useState('lifeCardsLoading', () => false)
  const { getAccessToken } = useApiClient()
  const { getLifeCards, saveLifeCards, resetLifeCards } = useWorkspaceApi()

  async function load () {
    if (!getAccessToken()) {
      cards.value = []
      loading.value = false
      return
    }

    loading.value = true
    try {
      const res = await getLifeCards()
      if (res.code === 200 && Array.isArray(res.data)) {
        cards.value = apiToLifeCards(res.data)
        return
      }
      cards.value = []
      if (res.code !== 401) {
        showApiError(res, '加载生活卡片失败')
      }
    } catch {
      cards.value = []
    } finally {
      loading.value = false
    }
  }

  async function persistApi (next: ReturnType<typeof lifeCardsToApiPayload>): Promise<boolean> {
    if (!getAccessToken()) return false

    const previous = cards.value
    const res = await saveLifeCards(next)
    if (res.code === 200 && Array.isArray(res.data)) {
      cards.value = apiToLifeCards(res.data)
      return true
    }

    cards.value = previous
    showApiError(res, '保存生活卡片失败')
    return false
  }

  function currentApiPayload () {
    return lifeCardsToApiPayload(cards.value)
  }

  async function addCard (label: string) {
    const trimmed = label.trim()
    if (!trimmed) return null
    const ok = await persistApi([
      ...currentApiPayload(),
      { id: '', label: trimmed, children: [] }
    ])
    if (!ok) return null
    return cards.value.find(c => c.label === trimmed)?.id ?? null
  }

  async function updateCard (id: string, label: string) {
    const trimmed = label.trim()
    if (!trimmed) return false
    return persistApi(currentApiPayload().map(card =>
      card.id === id ? { ...card, label: trimmed } : card
    ))
  }

  async function removeCard (id: string) {
    if (cards.value.length <= 1) return false
    return persistApi(currentApiPayload().filter(card => card.id !== id))
  }

  async function addChild (parentId: string, label: string) {
    const trimmed = label.trim()
    if (!trimmed) return null
    const ok = await persistApi(currentApiPayload().map(card => {
      if (card.id !== parentId) return card
      return {
        ...card,
        children: [...(card.children ?? []), { id: '', label: trimmed }]
      }
    }))
    if (!ok) return null
    return getCard(parentId)?.children.find(ch => ch.label === trimmed)?.id ?? null
  }

  async function updateChild (parentId: string, childId: string, label: string) {
    const trimmed = label.trim()
    if (!trimmed) return false
    return persistApi(currentApiPayload().map(card => {
      if (card.id !== parentId) return card
      return {
        ...card,
        children: (card.children ?? []).map(ch =>
          ch.id === childId ? { ...ch, label: trimmed } : ch
        )
      }
    }))
  }

  async function removeChild (parentId: string, childId: string) {
    return persistApi(currentApiPayload().map(card => {
      if (card.id !== parentId) return card
      return {
        ...card,
        children: (card.children ?? []).filter(ch => ch.id !== childId)
      }
    }))
  }

  async function resetDefaults () {
    if (!getAccessToken()) return false
    const res = await resetLifeCards()
    if (res.code === 200 && Array.isArray(res.data)) {
      cards.value = apiToLifeCards(res.data)
      return true
    }
    showApiError(res, '恢复默认失败')
    return false
  }

  function invalidate () {
    cards.value = []
  }

  const getCard = (id: string) => cards.value.find(c => c.id === id)

  const getChild = (parentId: string, childId: string) =>
    getCard(parentId)?.children.find(ch => ch.id === childId)

  const getRecordTitle = (parentId: string, childId?: string) => {
    const parent = getCard(parentId)
    if (!parent) return '记录'
    if (!childId) return parent.label
    const child = parent.children.find(ch => ch.id === childId)
    return child ? `${parent.label} · ${child.label}` : parent.label
  }

  const resolveMarkerLabel = (notes: string | null, fallbackTitle: string) => {
    const marker = decodeCardMarker(notes)
    if (!marker) return fallbackTitle
    return getRecordTitle(marker.parentId, marker.childId)
  }

  const findParentByLabel = (label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return undefined
    return cards.value.find(card => card.label === trimmed)
      ?? cards.value.find(card => card.label.includes(trimmed))
  }

  const findChildByLabel = (parentId: string, label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return undefined
    const parent = getCard(parentId)
    return parent?.children.find(child => child.label === trimmed)
      ?? parent?.children.find(child => child.label.includes(trimmed))
  }

  const pickToInput = (pick: LifeCardPick) => {
    const parent = getCard(pick.parentId)
    if (!parent) return ''
    if (!pick.childId) return formatLifePickInput(parent.label)
    const child = getChild(pick.parentId, pick.childId)
    return formatLifePickInput(parent.label, child?.label)
  }

  const ensurePickFromInput = async (raw: string): Promise<LifeCardPick | null> => {
    const parsed = parseLifePickInput(raw)
    if (!parsed) return null

    let parent = findParentByLabel(parsed.parentLabel)
    if (!parent) {
      const parentId = await addCard(parsed.parentLabel.trim())
      if (!parentId) return null
      parent = getCard(parentId)
    }
    if (!parent) return null

    if (!parsed.childLabel) {
      return { parentId: parent.id }
    }

    let child = findChildByLabel(parent.id, parsed.childLabel)
    if (!child) {
      const childId = await addChild(parent.id, parsed.childLabel)
      if (childId) child = getChild(parent.id, childId)
    }

    return child
      ? { parentId: parent.id, childId: child.id }
      : { parentId: parent.id }
  }

  return {
    cards,
    loading,
    load,
    invalidate,
    addCard,
    updateCard,
    removeCard,
    addChild,
    updateChild,
    removeChild,
    resetDefaults,
    getCard,
    getChild,
    getRecordTitle,
    resolveMarkerLabel,
    encodeCardMarker,
    pickToInput,
    ensurePickFromInput,
    searchLifePickItems
  }
}
