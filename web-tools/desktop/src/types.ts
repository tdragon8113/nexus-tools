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
  close: 'desktop:close'
} as const

export const LAUNCHER_WIDTH = 680
export const LAUNCHER_MIN_HEIGHT = 120

export const HUB_WIDTH = 760
export const HUB_HEIGHT = 560

export const TOOL_FLOAT_WIDTH = 800
export const TOOL_FLOAT_HEIGHT = 600
export const TOOL_FLOAT_MIN_WIDTH = 480
export const TOOL_FLOAT_MIN_HEIGHT = 360

export const TOOL_FLOAT_SIZE: Record<string, { width: number; height: number }> = {
  json: { width: 960, height: 720 },
  'text-diff': { width: 980, height: 680 },
  http: { width: 860, height: 640 },
  code: { width: 860, height: 620 },
  calculator: { width: 420, height: 520 }
}
