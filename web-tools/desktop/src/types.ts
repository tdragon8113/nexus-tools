import type { ContentHintKind } from '../../shared/toolSearch'

export interface OpenToolPayload {
  path: string
  toolId: string
  prefill?: string
  hintKind?: ContentHintKind
}

export const IPC = {
  searchResize: 'desktop:search-resize',
  searchMode: 'desktop:search-mode',
  panelMode: 'desktop:panel-mode',
  close: 'desktop:close',
  pinGet: 'desktop:pin-get',
  pinSet: 'desktop:pin-set',
  pinChanged: 'desktop:pinned-changed',
  clipboardPrefsGet: 'desktop:clipboard-prefs-get',
  clipboardPrefsPatch: 'desktop:clipboard-prefs-patch',
  clipboardWriteText: 'desktop:clipboard-write-text',
  updaterGetState: 'desktop:updater-get-state',
  updaterCheck: 'desktop:updater-check',
  updaterDownload: 'desktop:updater-download',
  updaterInstall: 'desktop:updater-install',
  updaterOpenRelease: 'desktop:updater-open-release',
  updateState: 'desktop:update-state',
  macAppsList: 'desktop:mac-apps-list',
  macAppGetIcon: 'desktop:mac-app-get-icon',
  macAppOpen: 'desktop:mac-app-open',
  windowThemeSync: 'desktop:window-theme-sync',
  totpSyncAccounts: 'desktop:totp-sync-accounts',
  totpGetAccounts: 'desktop:totp-get-accounts',
  totpGetShortcuts: 'desktop:totp-get-shortcuts',
  totpSetShortcut: 'desktop:totp-set-shortcut',
  totpSetShortcutCapture: 'desktop:totp-set-shortcut-capture',
  totpOpenAccessibility: 'desktop:totp-open-accessibility',
  totpOpenAccessibilitySettings: 'desktop:totp-open-accessibility-settings',
  totpGetAccessibility: 'desktop:totp-get-accessibility',
  rendererLocalStateGet: 'desktop:renderer-local-state-get',
  rendererLocalStatePatch: 'desktop:renderer-local-state-patch',
  ipLookup: 'desktop:ip-lookup',
  ipProxyStatus: 'desktop:ip-proxy-status',
  openExternal: 'desktop:open-external'
} as const

export type ClipboardOpenSource = 'hotkey' | 'navigation'

export type ShowSearchPayload = {
  clipboard?: string
  q?: string
  source?: ClipboardOpenSource
}

/** 搜索窗 / 工具集 / 工具页统一外框宽度（Raycast 主窗约 860px） */
export const DESKTOP_FRAME_WIDTH = 860

export const LAUNCHER_WIDTH = DESKTOP_FRAME_WIDTH

/** 工具页统一窗口尺寸（搜索窗满载时与之对齐） */
export const PANEL_WIDTH = DESKTOP_FRAME_WIDTH
export const PANEL_HEIGHT = 680

/** 搜索窗可缩放下限（顶栏 + 搜索框；须小于实际内容高度，避免窗体比壳体大一圈留白） */
export const LAUNCHER_MIN_HEIGHT = 236

/** 搜索窗可缩放上限：与工具页 PANEL_HEIGHT 一致，列表超出时在内部滚动 */
export const LAUNCHER_MAX_HEIGHT = PANEL_HEIGHT

/** 搜索窗手动拖动后，该时长内再次唤起保留位置；超时未再移动则恢复默认居中 */
export const SEARCH_POSITION_TTL_MS = 60 * 60 * 1000

/** 工具/设置页隐藏后，该时长内快捷键仍恢复该页；超时则回到搜索 */
export const PANEL_SESSION_TTL_MS = 60 * 60 * 1000

export const PANEL_MIN_WIDTH = 520
export const PANEL_MIN_HEIGHT = 400
