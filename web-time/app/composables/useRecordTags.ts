const STORAGE_PREFIX = 'nexus_record_tags'

export const DEFAULT_RECORD_TAGS = [
  '特殊记忆',
  '里程碑',
  '小确幸',
  '旅行',
  '纪念日'
] as const

function storageKey (userId?: number | null) {
  return userId != null ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX
}

function readLibrary (key: string): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_RECORD_TAGS]
  const raw = localStorage.getItem(key)
  if (!raw) return [...DEFAULT_RECORD_TAGS]
  try {
    const parsed = JSON.parse(raw) as string[]
    return parsed.length > 0 ? parsed : [...DEFAULT_RECORD_TAGS]
  } catch {
    return [...DEFAULT_RECORD_TAGS]
  }
}

function writeLibrary (key: string, tags: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(tags))
}

export function normalizeTag (tag: string) {
  return tag.trim().slice(0, 12)
}

export function parseTagsLine (value: string) {
  return value
    .split(/[,，]/)
    .map(normalizeTag)
    .filter(Boolean)
}

export function useRecordTags () {
  const { getUserId } = useApiClient()
  const tagLibrary = useState<string[]>('recordTagLibrary', () => [...DEFAULT_RECORD_TAGS])

  const load = () => {
    tagLibrary.value = readLibrary(storageKey(getUserId()))
  }

  const persist = (next: string[]) => {
    const unique = [...new Set(next.map(normalizeTag).filter(Boolean))]
    tagLibrary.value = unique
    writeLibrary(storageKey(getUserId()), unique)
  }

  const ensureInLibrary = (tag: string) => {
    const normalized = normalizeTag(tag)
    if (!normalized) return
    if (!tagLibrary.value.includes(normalized)) {
      persist([...tagLibrary.value, normalized])
    }
  }

  const ensureAllInLibrary = (tags: string[]) => {
    tags.forEach(ensureInLibrary)
  }

  const removeFromLibrary = (tag: string) => {
    persist(tagLibrary.value.filter(item => item !== tag))
  }

  const resetToDefaults = () => {
    persist([...DEFAULT_RECORD_TAGS])
  }

  if (typeof window !== 'undefined') {
    load()
  }

  return {
    tagLibrary,
    load,
    persist,
    ensureInLibrary,
    ensureAllInLibrary,
    removeFromLibrary,
    resetToDefaults
  }
}
