import type { ContentHintKind } from '~/core/search'

export interface NexusOpenToolPayload {
  path: string
  toolId: string
  prefill?: string
  hintKind?: ContentHintKind
}

import type { ClipboardOpenSource, ClipboardPolicy } from '~/core/desktopClipboardPolicy'
import type { DesktopThemePreference } from '~/core/desktopTheme'

export type NexusShowSearchPayload = {
  clipboard?: string
  q?: string
  source?: ClipboardOpenSource
}

export type NexusClipboardPrefs = {
  clipboardPolicy: ClipboardPolicy
  lastAppliedClipboardHash?: string
  dismissedClipboardHash?: string
  autoHideOnBlur?: boolean
  autoUpdateEnabled?: boolean
  openAtLogin?: boolean
  theme?: DesktopThemePreference
}

export type NexusUpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type NexusUpdateState = {
  status: NexusUpdateStatus
  currentVersion: string
  latestVersion?: string
  releaseTag?: string
  releaseUrl?: string
  percent?: number
  error?: string
  manualInstallRecommended?: boolean
}

export interface NexusDesktopBridge {
  isDesktop: true
  resizeSearch(height: number): void
  close(): void
  notifySearchMode?(): void
  notifyPanelMode?(path: string): Promise<void>
  getPinned?(): Promise<boolean>
  setPinned?(pinned: boolean): Promise<boolean>
  onPinnedChange?(handler: (pinned: boolean) => void): () => void
  getClipboardPrefs?(): Promise<NexusClipboardPrefs>
  patchClipboardPrefs?(patch: Partial<NexusClipboardPrefs>): Promise<NexusClipboardPrefs>
  writeClipboardText?(text: string): Promise<boolean>
  syncWindowTheme?(theme: 'light' | 'dark'): void
  getUpdateState?(): Promise<NexusUpdateState>
  checkForUpdates?(): Promise<NexusUpdateState>
  downloadUpdate?(): Promise<NexusUpdateState>
  installUpdate?(): void
  openUpdateReleasePage?(): void
  onUpdateState?(handler: (state: NexusUpdateState) => void): () => void
  applyOpenTool?(payload: NexusOpenToolPayload): void
  onShowSearch(handler: (payload: NexusShowSearchPayload) => void): () => void
  onOpenTool?(handler: (payload: NexusOpenToolPayload) => void): () => void
  listMacApps?(): Promise<import('~~/shared/macApps').MacAppEntry[]>
  getMacAppIcon?(appPath: string): Promise<string | null>
  openMacApp?(appPath: string): Promise<boolean>
  syncTotpAccounts?(accounts: import('~~/utils/totp').StoredTotpAccount[]): Promise<
    import('~~/utils/totp').StoredTotpAccount[]
  >
  getTotpAccounts?(): Promise<import('~~/utils/totp').StoredTotpAccount[]>
  getTotpShortcuts?(): Promise<Record<string, string>>
  setTotpShortcut?(
    accountId: string,
    accelerator: string | null
  ): Promise<{ ok: boolean; error?: string }>
  setTotpShortcutCapture?(active: boolean): Promise<boolean>
  requestTotpAccessibilityPermission?(): Promise<{
    trusted: boolean
    required: boolean
    appName: string
    isDev: boolean
    hint: string
    authStatus?: string
    launchHost?: string | null
    prompted: boolean
    openedSettings: boolean
  }>
  openTotpAccessibilitySettings?(): Promise<{
    trusted: boolean
    required: boolean
    appName: string
    isDev: boolean
    hint: string
    authStatus?: string
    launchHost?: string | null
  }>
  getTotpAccessibilityStatus?(): Promise<{
    trusted: boolean
    required: boolean
    appName: string
    isDev: boolean
    hint: string
    authStatus?: string
    launchHost?: string | null
  }>
  getRendererLocalState?(): Promise<import('~~/shared/rendererLocalState').RendererLocalStateMap>
  patchRendererLocalState?(
    patch: import('~~/shared/rendererLocalState').RendererLocalStateMap
  ): Promise<import('~~/shared/rendererLocalState').RendererLocalStateMap>
}

declare global {
  interface Window {
    nexusDesktop?: NexusDesktopBridge
  }
}

export {}
