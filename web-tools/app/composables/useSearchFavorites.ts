import { macAppToSearchResult, toolToSearchResult, type SearchResultItem } from '~/core/searchResults'
import { getToolById } from '~/core/tools'
import type { MacAppEntry } from '~~/shared/macApps'

const STORAGE_KEY = 'nexus-search-favorites-v1'

export interface SearchFavoriteEntry {
  id: string
  kind: 'tool' | 'mac-app'
  title: string
  toolId?: string
  appId?: string
  addedAt: number
}

function readStorage(): SearchFavoriteEntry[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SearchFavoriteEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorage(entries: SearchFavoriteEntry[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore quota */
  }
}

function entryFromItem(item: SearchResultItem): SearchFavoriteEntry {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    addedAt: Date.now(),
    ...(item.kind === 'tool' && item.tool ? { toolId: item.tool.id } : {}),
    ...(item.kind === 'mac-app' && item.app ? { appId: item.app.id } : {})
  }
}

export function useSearchFavorites() {
  const entries = useState<SearchFavoriteEntry[]>('search-favorites', () => [])

  const favoriteIds = computed(() => new Set(entries.value.map((row) => row.id)))

  function syncFromStorage() {
    entries.value = readStorage()
  }

  function isFavorite(id: string): boolean {
    return favoriteIds.value.has(id)
  }

  function toggleFavorite(item: SearchResultItem): boolean {
    const index = entries.value.findIndex((row) => row.id === item.id)
    if (index >= 0) {
      entries.value = entries.value.filter((row) => row.id !== item.id)
      writeStorage(entries.value)
      return false
    }
    entries.value = [...entries.value, entryFromItem(item)]
    writeStorage(entries.value)
    return true
  }

  function resolveFavoriteItems(macApps: MacAppEntry[]): SearchResultItem[] {
    const items: SearchResultItem[] = []
    for (const entry of entries.value) {
      if (entry.kind === 'tool' && entry.toolId) {
        const tool = getToolById(entry.toolId)
        if (tool?.path) items.push(toolToSearchResult(tool))
        continue
      }
      if (entry.kind === 'mac-app' && entry.appId) {
        const app = macApps.find((row) => row.id === entry.appId)
        if (app) items.push(macAppToSearchResult(app))
      }
    }
    return items
  }

  function prioritizeFavorites(items: SearchResultItem[]): SearchResultItem[] {
    if (!items.length || !favoriteIds.value.size) return items
    const favs: SearchResultItem[] = []
    const rest: SearchResultItem[] = []
    for (const item of items) {
      if (favoriteIds.value.has(item.id)) favs.push(item)
      else rest.push(item)
    }
    return [...favs, ...rest]
  }

  return {
    entries,
    favoriteIds,
    syncFromStorage,
    isFavorite,
    toggleFavorite,
    resolveFavoriteItems,
    prioritizeFavorites
  }
}
