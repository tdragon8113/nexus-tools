/** Electron 桌面壳路由 */
export const DESKTOP_ROUTES = {
  search: '/desktop/search',
  hub: '/desktop/hub'
} as const

export type DesktopScreen = 'search' | 'hub' | 'tool'

export function desktopScreenFromPath(path: string): DesktopScreen {
  if (path === DESKTOP_ROUTES.search) return 'search'
  if (path === DESKTOP_ROUTES.hub) return 'hub'
  return 'tool'
}

export function isElectronShell(): boolean {
  return import.meta.client && window.nexusDesktop?.isDesktop === true
}
