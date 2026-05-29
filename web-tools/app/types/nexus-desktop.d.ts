import type { ContentHintKind } from '~/core/search'

export interface NexusOpenToolPayload {
  path: string
  toolId: string
  prefill?: string
  hintKind?: ContentHintKind
}

import type { ClipboardOpenSource, ClipboardPolicy } from '~/core/desktopClipboardPolicy'

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
  getUpdateState?(): Promise<NexusUpdateState>
  checkForUpdates?(): Promise<NexusUpdateState>
  downloadUpdate?(): Promise<NexusUpdateState>
  installUpdate?(): void
  openUpdateReleasePage?(): void
  onUpdateState?(handler: (state: NexusUpdateState) => void): () => void
  applyOpenTool?(payload: NexusOpenToolPayload): void
  onShowSearch(handler: (payload: NexusShowSearchPayload) => void): () => void
  onOpenTool?(handler: (payload: NexusOpenToolPayload) => void): () => void
}

declare global {
  interface Window {
    nexusDesktop?: NexusDesktopBridge
  }
}

export {}
