/** Electron 桌面壳路由 */
export const DESKTOP_ROUTES = {
  search: '/desktop/search',
  settings: '/desktop/settings'
} as const

export type DesktopScreen = 'search' | 'tool' | 'settings'

export function desktopScreenFromPath(path: string): DesktopScreen {
  if (path === DESKTOP_ROUTES.search) return 'search'
  if (path === DESKTOP_ROUTES.settings) return 'settings'
  return 'tool'
}

/** 堆叠式工具页：面板 main 区域纵向滚动（相对路径，与 definePageMeta 双保险） */
const DESKTOP_PANEL_SCROLL_PATHS = new Set<string>([
  DESKTOP_ROUTES.settings,
  '/tools/hash',
  '/tools/url',
  '/tools/uuid',
  '/tools/password',
  '/tools/qrcode',
  '/tools/color',
  '/tools/timestamp',
  '/tools/http',
  '/tools/regex',
  '/tools/code',
  '/tools/calculator'
])

export function desktopPanelScrollFromPath(path: string): boolean {
  return DESKTOP_PANEL_SCROLL_PATHS.has(path)
}

export function isElectronShell(): boolean {
  return import.meta.client && window.nexusDesktop?.isDesktop === true
}
