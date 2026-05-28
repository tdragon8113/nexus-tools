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
