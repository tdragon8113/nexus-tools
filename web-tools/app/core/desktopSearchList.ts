import { mergeSearchResults, type SearchResultItem } from '~/core/searchResults'
import type { SiteTool } from '~/core/tools'
import type { MacAppEntry } from '~~/shared/macApps'

function tagSection(items: SearchResultItem[], section?: string): SearchResultItem[] {
  if (!section) return items
  return items.map((item) => ({ ...item, section }))
}

export type BuildDesktopSearchItemsInput = {
  commandTrimmed: string
  queryTrimmed: string
  displayTools: SiteTool[]
  displayMacApps: MacAppEntry[]
  macApps: MacAppEntry[]
  prioritizeFavorites: (items: SearchResultItem[]) => SearchResultItem[]
  resolveFavoriteItems: (macApps: MacAppEntry[]) => SearchResultItem[]
  resolveRecentItems: (macApps: MacAppEntry[]) => SearchResultItem[]
}

export function buildDesktopSearchItems(input: BuildDesktopSearchItemsInput): SearchResultItem[] {
  const merged = mergeSearchResults(input.displayTools, input.displayMacApps)

  if (input.commandTrimmed) {
    const rows = input.prioritizeFavorites(merged)
    return tagSection(rows, rows.length ? 'Results' : undefined)
  }

  if (input.queryTrimmed) {
    const rows = input.prioritizeFavorites(merged)
    return tagSection(rows, rows.length ? '内容匹配' : undefined)
  }

  const favorites = input.resolveFavoriteItems(input.macApps)
  const favoriteIds = new Set(favorites.map((row) => row.id))
  const recents = input.resolveRecentItems(input.macApps).filter((row) => !favoriteIds.has(row.id))
  const recentIds = new Set(recents.map((row) => row.id))
  const suggestions = merged.filter((row) => !favoriteIds.has(row.id) && !recentIds.has(row.id))
  const out: SearchResultItem[] = []

  if (recents.length) out.push(...tagSection(recents, '最近使用'))
  if (favorites.length) out.push(...tagSection(favorites, '收藏'))
  if (suggestions.length) {
    const hasPrior = recents.length > 0 || favorites.length > 0
    out.push(...tagSection(suggestions, hasPrior ? '建议' : undefined))
  }
  return out
}
