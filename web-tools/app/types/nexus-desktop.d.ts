import type { ContentHintKind } from '~/core/search'

export interface NexusOpenToolPayload {
  path: string
  toolId: string
  prefill?: string
  hintKind?: ContentHintKind
}

export interface NexusDesktopBridge {
  isDesktop: true
  resizeSearch(height: number): void
  close(): void
  notifySearchMode?(): void
  notifyPanelMode?(path: string): void
  applyOpenTool?(payload: NexusOpenToolPayload): void
  onShowSearch(handler: (payload: { clipboard?: string; q?: string }) => void): () => void
  onOpenTool?(handler: (payload: NexusOpenToolPayload) => void): () => void
}

declare global {
  interface Window {
    nexusDesktop?: NexusDesktopBridge
  }
}

export {}
