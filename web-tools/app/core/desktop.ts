/** Electron 桌面壳路由约定 */
export const DESKTOP_QUERY = 'desktop'
export const DESKTOP_QUERY_VALUE = '1'

export const DESKTOP_ROUTES = {
  search: '/desktop/search',
  hub: '/desktop/hub'
} as const

export function isDesktopQuery(query: Record<string, unknown>): boolean {
  return query[DESKTOP_QUERY] === DESKTOP_QUERY_VALUE
}

export function desktopQuery(extra: Record<string, string> = {}): Record<string, string> {
  return { [DESKTOP_QUERY]: DESKTOP_QUERY_VALUE, ...extra }
}

export type DesktopScreen = 'search' | 'hub' | 'tool'

export function desktopScreenFromPath(path: string): DesktopScreen {
  if (path === DESKTOP_ROUTES.search) return 'search'
  if (path === DESKTOP_ROUTES.hub) return 'hub'
  return 'tool'
}
