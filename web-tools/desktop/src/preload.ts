import { contextBridge, ipcRenderer } from 'electron'
import type { OpenToolPayload, ShowSearchPayload } from './types'
import { IPC } from './types'
import type { UpdateState } from './updater'

let pendingShowSearch: ShowSearchPayload | null = null
let showSearchHandler: ((payload: ShowSearchPayload) => void) | null = null

ipcRenderer.on('desktop:show-search', (_e, payload: ShowSearchPayload) => {
  if (showSearchHandler) showSearchHandler(payload)
  else pendingShowSearch = payload
})

contextBridge.exposeInMainWorld('nexusDesktop', {
  isDesktop: true as const,
  resizeSearch(height: number) {
    ipcRenderer.send(IPC.searchResize, height)
  },
  close() {
    ipcRenderer.send(IPC.close)
  },
  applyOpenTool(_payload: OpenToolPayload) {
    /* SPA 内由 useDesktop + desktop.client 插件消费 */
  },
  notifySearchMode() {
    ipcRenderer.send(IPC.searchMode)
  },
  notifyPanelMode(path: string) {
    return ipcRenderer.invoke(IPC.panelMode, path) as Promise<void>
  },
  getPinned() {
    return ipcRenderer.invoke(IPC.pinGet) as Promise<boolean>
  },
  setPinned(pinned: boolean) {
    return ipcRenderer.invoke(IPC.pinSet, pinned) as Promise<boolean>
  },
  onPinnedChange(handler: (pinned: boolean) => void) {
    const listener = (_e: unknown, pinned: boolean) => handler(pinned)
    ipcRenderer.on(IPC.pinChanged, listener)
    return () => ipcRenderer.removeListener(IPC.pinChanged, listener)
  },
  getClipboardPrefs() {
    return ipcRenderer.invoke(IPC.clipboardPrefsGet) as Promise<{
      clipboardPolicy: 'smart' | 'always' | 'never'
      lastAppliedClipboardHash?: string
      dismissedClipboardHash?: string
      autoHideOnBlur?: boolean
      autoUpdateEnabled?: boolean
      openAtLogin?: boolean
      theme?: 'light' | 'dark' | 'system'
    }>
  },
  patchClipboardPrefs(patch: {
    clipboardPolicy?: 'smart' | 'always' | 'never'
    lastAppliedClipboardHash?: string
    dismissedClipboardHash?: string
    autoHideOnBlur?: boolean
    autoUpdateEnabled?: boolean
    openAtLogin?: boolean
    theme?: 'light' | 'dark' | 'system'
  }) {
    return ipcRenderer.invoke(IPC.clipboardPrefsPatch, patch) as Promise<{
      clipboardPolicy: 'smart' | 'always' | 'never'
      lastAppliedClipboardHash?: string
      dismissedClipboardHash?: string
      autoHideOnBlur?: boolean
      autoUpdateEnabled?: boolean
      openAtLogin?: boolean
      theme?: 'light' | 'dark' | 'system'
    }>
  },
  syncWindowTheme(theme: 'light' | 'dark') {
    ipcRenderer.send(IPC.windowThemeSync, theme)
  },
  getUpdateState() {
    return ipcRenderer.invoke(IPC.updaterGetState) as Promise<UpdateState>
  },
  checkForUpdates() {
    return ipcRenderer.invoke(IPC.updaterCheck) as Promise<UpdateState>
  },
  downloadUpdate() {
    return ipcRenderer.invoke(IPC.updaterDownload) as Promise<UpdateState>
  },
  installUpdate() {
    ipcRenderer.send(IPC.updaterInstall)
  },
  openUpdateReleasePage() {
    ipcRenderer.send(IPC.updaterOpenRelease)
  },
  onUpdateState(handler: (state: UpdateState) => void) {
    const listener = (_e: unknown, state: UpdateState) => handler(state)
    ipcRenderer.on(IPC.updateState, listener)
    return () => ipcRenderer.removeListener(IPC.updateState, listener)
  },
  onShowSearch(handler: (payload: ShowSearchPayload) => void) {
    showSearchHandler = handler
    if (pendingShowSearch) {
      handler(pendingShowSearch)
      pendingShowSearch = null
    }
    return () => {
      if (showSearchHandler === handler) showSearchHandler = null
    }
  },
  onOpenTool(handler: (payload: OpenToolPayload) => void) {
    const channel = 'desktop:open-tool'
    const listener = (_e: unknown, payload: OpenToolPayload) => handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  listMacApps() {
    return ipcRenderer.invoke(IPC.macAppsList) as Promise<
      import('../../shared/macApps').MacAppEntry[]
    >
  },
  getMacAppIcon(appPath: string) {
    return ipcRenderer.invoke(IPC.macAppGetIcon, appPath) as Promise<string | null>
  },
  openMacApp(appPath: string) {
    return ipcRenderer.invoke(IPC.macAppOpen, appPath) as Promise<boolean>
  },
  syncTotpAccounts(accounts: import('../../utils/totp').StoredTotpAccount[]) {
    return ipcRenderer.invoke(IPC.totpSyncAccounts, accounts) as Promise<
      import('../../utils/totp').StoredTotpAccount[]
    >
  },
  getTotpShortcuts() {
    return ipcRenderer.invoke(IPC.totpGetShortcuts) as Promise<Record<string, string>>
  },
  setTotpShortcut(accountId: string, accelerator: string | null) {
    return ipcRenderer.invoke(IPC.totpSetShortcut, { accountId, accelerator }) as Promise<{
      ok: boolean
      error?: string
    }>
  },
  requestTotpAccessibilityPermission() {
    return ipcRenderer.invoke(IPC.totpOpenAccessibility) as Promise<{
      trusted: boolean
      required: boolean
      appName: string
      isDev: boolean
      hint: string
      prompted: boolean
      openedSettings: boolean
    }>
  },
  openTotpAccessibilitySettings() {
    return ipcRenderer.invoke(IPC.totpOpenAccessibilitySettings) as Promise<{
      trusted: boolean
      required: boolean
      appName: string
      isDev: boolean
      hint: string
    }>
  },
  getTotpAccessibilityStatus() {
    return ipcRenderer.invoke(IPC.totpGetAccessibility) as Promise<{
      trusted: boolean
      required: boolean
      appName: string
      isDev: boolean
      hint: string
    }>
  }
})
