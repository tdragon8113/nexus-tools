export interface SearchRecentEntry {
  id: string
  kind: 'tool' | 'mac-app'
  title: string
  toolId?: string
  appId?: string
  lastUsed: number
}

export interface SearchFavoriteEntry {
  id: string
  kind: 'tool' | 'mac-app'
  title: string
  toolId?: string
  appId?: string
  addedAt: number
}

export interface DesktopSearchState {
  recents: SearchRecentEntry[]
  favorites: SearchFavoriteEntry[]
}
