import type { ActivityCategory } from './useWorkspaceApi'

export type {
  FeelingRating,
  ParsedRecordNotes
} from './life-cards/notes'

import { parseRecordNotes } from './life-cards/notes'

export {
  FEELING_LEVELS,
  encodeCardMarker,
  decodeCardMarker,
  getFeelingLevel,
  formatFeelingDisplay,
  buildRecordNotes,
  activityHasTag,
  parseRecordNotes
} from './life-cards/notes'

export function collectAllTags (notesList: Array<string | null>) {
  const set = new Set<string>()
  for (const notes of notesList) {
    for (const tag of parseRecordNotes(notes).tags ?? []) {
      set.add(tag)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export type LifeCardColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'slate'

export interface LifeCardChild {
  id: string
  label: string
}

export interface LifeCard {
  id: string
  label: string
  icon: string
  color: LifeCardColor
  category: ActivityCategory
  children?: LifeCardChild[]
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
  const child = childLabel?.trim()
  if (!parent) return ''
  return child ? `${parent}/${child}` : parent
}

export function parseLifePickInput (raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/[/／·]/).map(part => part.trim()).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return { parentLabel: parts[0]! }
  return { parentLabel: parts[0]!, childLabel: parts.slice(1).join('/') }
}

export interface LifePickSearchItem {
  text: string
  parentId: string
  childId?: string
  parentLabel: string
  childLabel?: string
}

export function buildLifePickSearchItems (cards: LifeCard[]): LifePickSearchItem[] {
  const items: LifePickSearchItem[] = []
  for (const parent of cards) {
    if (!parent.children?.length) {
      items.push({
        text: formatLifePickInput(parent.label),
        parentId: parent.id,
        parentLabel: parent.label
      })
      continue
    }
    for (const child of parent.children) {
      items.push({
        text: formatLifePickInput(parent.label, child.label),
        parentId: parent.id,
        childId: child.id,
        parentLabel: parent.label,
        childLabel: child.label
      })
    }
  }
  return items
}

function lifePickSearchScore (query: string, item: LifePickSearchItem) {
  const q = query.trim().toLowerCase()
  if (!q) return 1

  const candidates = [
    item.text,
    item.parentLabel,
    item.childLabel ?? '',
    `${item.parentLabel}/${item.childLabel ?? ''}`
  ].map(value => value.toLowerCase())

  let best = 0
  for (const candidate of candidates) {
    if (!candidate) continue
    if (candidate === q) best = Math.max(best, 100)
    else if (candidate.startsWith(q)) best = Math.max(best, 80)
    else if (candidate.includes(q)) best = Math.max(best, 60)
  }
  return best
}

export function searchLifePickItems (cards: LifeCard[], query: string, limit = 8) {
  const items = buildLifePickSearchItems(cards)
  const q = query.trim()
  if (!q) return items.slice(0, limit)

  return items
    .map(item => ({ item, score: lifePickSearchScore(q, item) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || a.item.text.localeCompare(b.item.text, 'zh-CN')
    )
    .slice(0, limit)
    .map(entry => entry.item)
}

export function buildLifePickOptions (cards: LifeCard[]) {
  const options: Array<{ text: string, value: string }> = []
  for (const parent of cards) {
    if (!parent.children?.length) {
      options.push({ text: parent.label, value: encodeLifePickValue(parent.id) })
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
    if (parent && !parent.children?.length) return { parentId: parent.id }
  }

  return decodeLifePickValue(options[0]!.value)
}

export function lifePickToValue (pick: LifeCardPick, cards: LifeCard[]) {
  const parent = cards.find(card => card.id === pick.parentId)
  if (pick.childId) return encodeLifePickValue(pick.parentId, pick.childId)
  if (parent?.children?.length) return encodeLifePickValue(pick.parentId, '__other__')
  return encodeLifePickValue(pick.parentId)
}

export const LIFE_CARD_COLORS: Record<LifeCardColor, { bg: string; text: string; ring: string }> = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-400' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-400' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-400' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-400' }
}

export const LIFE_CARD_ICON_OPTIONS = [
  'flower-o',
  'briefcase-o',
  'fire-o',
  'bookmark-o',
  'friends-o',
  'location-o',
  'smile-o',
  'coffee-o',
  'music-o',
  'shopping-cart-o'
] as const

export const DEFAULT_LIFE_CARDS: LifeCard[] = [
  {
    id: 'daily',
    label: '日常',
    icon: 'flower-o',
    color: 'slate',
    category: 'other',
    children: [
      { id: 'daily_cook', label: '做饭' },
      { id: 'daily_chore', label: '家务' },
      { id: 'daily_shop', label: '购物' }
    ]
  },
  {
    id: 'work',
    label: '工作',
    icon: 'briefcase-o',
    color: 'amber',
    category: 'meeting',
    children: [
      { id: 'work_meeting', label: '会议' },
      { id: 'work_code', label: '写代码' },
      { id: 'work_comm', label: '沟通' }
    ]
  },
  {
    id: 'sport',
    label: '运动',
    icon: 'fire-o',
    color: 'rose',
    category: 'other',
    children: [
      { id: 'sport_run', label: '跑步' },
      { id: 'sport_gym', label: '健身' },
      { id: 'sport_walk', label: '散步' }
    ]
  },
  {
    id: 'read',
    label: '阅读',
    icon: 'bookmark-o',
    color: 'indigo',
    category: 'other',
    children: [
      { id: 'read_book', label: '读书' },
      { id: 'read_article', label: '文章' }
    ]
  },
  {
    id: 'social',
    label: '社交',
    icon: 'friends-o',
    color: 'emerald',
    category: 'other',
    children: [
      { id: 'social_meet', label: '见面' },
      { id: 'social_chat', label: '聊天' }
    ]
  },
  {
    id: 'travel',
    label: '出行',
    icon: 'location-o',
    color: 'sky',
    category: 'other',
    children: [
      { id: 'travel_commute', label: '通勤' },
      { id: 'travel_trip', label: '外出' }
    ]
  }
]

const STORAGE_PREFIX = 'nexus_life_cards'

function storageKey (userId?: number | null) {
  return userId != null ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX
}

function normalizeCards (raw: LifeCard[]): LifeCard[] {
  const defaultMap = new Map(DEFAULT_LIFE_CARDS.map(c => [c.id, c]))
  return raw.map(card => {
    const defaults = defaultMap.get(card.id)
    const children = Array.isArray(card.children) && card.children.length > 0
      ? card.children
      : defaults?.children ?? []
    return { ...card, children }
  })
}

function readCards (key: string): LifeCard[] {
  if (typeof window === 'undefined') return normalizeCards([...DEFAULT_LIFE_CARDS])
  const raw = localStorage.getItem(key)
  if (!raw) return normalizeCards([...DEFAULT_LIFE_CARDS])
  try {
    const parsed = JSON.parse(raw) as LifeCard[]
    return parsed.length > 0 ? normalizeCards(parsed) : normalizeCards([...DEFAULT_LIFE_CARDS])
  } catch {
    return normalizeCards([...DEFAULT_LIFE_CARDS])
  }
}

function writeCards (key: string, cards: LifeCard[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(cards))
}

export function createLifeCardId () {
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function useLifeCards () {
  const { getUserId } = useApiClient()
  const cards = useState<LifeCard[]>('lifeCards', () => normalizeCards([...DEFAULT_LIFE_CARDS]))

  const load = () => {
    cards.value = readCards(storageKey(getUserId()))
  }

  const persist = (next: LifeCard[]) => {
    cards.value = next
    writeCards(storageKey(getUserId()), next)
  }

  const addCard = (card: Omit<LifeCard, 'id'> & { id?: string }) => {
    const id = card.id ?? createLifeCardId()
    persist([...cards.value, {
      ...card,
      id,
      children: card.children ?? []
    }])
    return id
  }

  const updateCard = (id: string, patch: Partial<Omit<LifeCard, 'id'>>) => {
    persist(cards.value.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeCard = (id: string) => {
    if (cards.value.length <= 1) return false
    persist(cards.value.filter(c => c.id !== id))
    return true
  }

  const addChild = (parentId: string, label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return null
    const childId = createLifeCardId()
    persist(cards.value.map(c => {
      if (c.id !== parentId) return c
      const children = [...(c.children ?? []), { id: childId, label: trimmed }]
      return { ...c, children }
    }))
    return childId
  }

  const updateChild = (parentId: string, childId: string, label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return false
    persist(cards.value.map(c => {
      if (c.id !== parentId) return c
      const children = (c.children ?? []).map(ch =>
        ch.id === childId ? { ...ch, label: trimmed } : ch
      )
      return { ...c, children }
    }))
    return true
  }

  const removeChild = (parentId: string, childId: string) => {
    persist(cards.value.map(c => {
      if (c.id !== parentId) return c
      return { ...c, children: (c.children ?? []).filter(ch => ch.id !== childId) }
    }))
    return true
  }

  const resetDefaults = () => {
    persist(normalizeCards([...DEFAULT_LIFE_CARDS]))
  }

  const getCard = (id: string) => cards.value.find(c => c.id === id)

  const getChild = (parentId: string, childId: string) =>
    getCard(parentId)?.children?.find(ch => ch.id === childId)

  const getRecordTitle = (parentId: string, childId?: string) => {
    const parent = getCard(parentId)
    if (!parent) return '记录'
    if (!childId) return parent.label
    const child = parent.children?.find(ch => ch.id === childId)
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
    return parent?.children?.find(child => child.label === trimmed)
      ?? parent?.children?.find(child => child.label.includes(trimmed))
  }

  const pickToInput = (pick: LifeCardPick) => {
    const parent = getCard(pick.parentId)
    if (!parent) return ''
    if (!pick.childId) return formatLifePickInput(parent.label)
    const child = getChild(pick.parentId, pick.childId)
    return formatLifePickInput(parent.label, child?.label)
  }

  /** 解析「分类/子项」，不存在则自动创建 */
  const ensurePickFromInput = (raw: string): LifeCardPick | null => {
    const parsed = parseLifePickInput(raw)
    if (!parsed) return null

    let parent = findParentByLabel(parsed.parentLabel)
    if (!parent) {
      const parentId = addCard({
        label: parsed.parentLabel.trim(),
        icon: 'flower-o',
        color: 'slate',
        category: 'other',
        children: []
      })
      parent = getCard(parentId)
    }
    if (!parent) return null

    if (!parsed.childLabel) {
      return { parentId: parent.id }
    }

    let child = findChildByLabel(parent.id, parsed.childLabel)
    if (!child) {
      const childId = addChild(parent.id, parsed.childLabel)
      if (childId) child = getChild(parent.id, childId)
    }

    return child
      ? { parentId: parent.id, childId: child.id }
      : { parentId: parent.id }
  }

  if (typeof window !== 'undefined') {
    load()
  }

  return {
    cards,
    load,
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
