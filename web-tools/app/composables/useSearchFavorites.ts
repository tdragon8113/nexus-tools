import { macAppToSearchResult, toolToSearchResult, type SearchResultItem } from '~/core/searchResults'
import { getToolById } from '~/core/tools'
import { persistDesktopLocalStateKeyFireAndForget } from '~/core/desktopLocalState'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'
import type { MacAppEntry } from '~~/shared/macApps'
import type { SearchFavoriteEntry } from '~~/shared/searchState'

const STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.searchFavorites

export type { SearchFavoriteEntry }

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
    /* 由 hydrateDesktopLocalStateFromMain 在插件阶段灌入 useState */
  }

  function isFavorite(id: string): boolean {
    return favoriteIds.value.has(id)
  }

  function toggleFavorite(item: SearchResultItem): boolean {
    const index = entries.value.findIndex((row) => row.id === item.id)
    if (index >= 0) {
      entries.value = entries.value.filter((row) => row.id !== item.id)
      persistDesktopLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(entries.value))
      return false
    }
    entries.value = [...entries.value, entryFromItem(item)]
    persistDesktopLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(entries.value))
    return true
  }

  function setFavoriteOrder(itemIds: string[]) {
    const map = new Map(entries.value.map((row) => [row.id, row]))
    const next: SearchFavoriteEntry[] = []
    for (const id of itemIds) {
      const entry = map.get(id)
      if (entry) next.push(entry)
    }
    for (const entry of entries.value) {
      if (!itemIds.includes(entry.id)) next.push(entry)
    }
    entries.value = next
    persistDesktopLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(entries.value))
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
    setFavoriteOrder,
    resolveFavoriteItems,
    prioritizeFavorites
  }
}
