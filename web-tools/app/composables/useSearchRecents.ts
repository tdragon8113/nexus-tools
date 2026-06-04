import { macAppToSearchResult, toolToSearchResult, type SearchResultItem } from '~/core/searchResults'
import { getToolById } from '~/core/tools'
import type { MacAppEntry } from '~~/shared/macApps'

const STORAGE_KEY = 'nexus-search-recents-v1'
const MAX_RECENTS = 8

export interface SearchRecentEntry {
  id: string
  kind: 'tool' | 'mac-app'
  title: string
  toolId?: string
  appId?: string
  lastUsed: number
}

function readStorage(): SearchRecentEntry[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SearchRecentEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorage(entries: SearchRecentEntry[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore quota */
  }
}

export function useSearchRecents() {
  const entries = useState<SearchRecentEntry[]>('search-recents', () => [])

  function syncFromStorage() {
    entries.value = readStorage()
  }

  function recordItem(item: SearchResultItem) {
    const next: SearchRecentEntry = {
      id: item.id,
      kind: item.kind,
      title: item.title,
      lastUsed: Date.now(),
      ...(item.kind === 'tool' && item.tool ? { toolId: item.tool.id } : {}),
      ...(item.kind === 'mac-app' && item.app ? { appId: item.app.id } : {})
    }
    const rest = entries.value.filter((row) => row.id !== next.id)
    entries.value = [next, ...rest].slice(0, MAX_RECENTS)
    writeStorage(entries.value)
  }

  function resolveRecentItems(macApps: MacAppEntry[]): SearchResultItem[] {
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

  return {
    entries,
    syncFromStorage,
    recordItem,
    resolveRecentItems
  }
}
