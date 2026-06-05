/** 桌面端由主进程 userData 持久化、启动时同步到 localStorage 的键 */
export const RENDERER_LOCAL_STATE_KEYS = {
  searchRecents: 'nexus-search-recents-v1',
  searchFavorites: 'nexus-search-favorites-v1',
  toolOrder: 'nexus-tool-order-v1',
  themePreference: 'nexus-desktop-theme-preference'
} as const

export type RendererLocalStateMap = Record<string, string>

export const MANAGED_RENDERER_LOCAL_STATE_KEYS: readonly string[] = Object.values(
  RENDERER_LOCAL_STATE_KEYS
)
