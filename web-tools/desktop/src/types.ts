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

/** 工具集与所有工具页统一窗口尺寸 */
export const PANEL_WIDTH = 800
export const PANEL_HEIGHT = 600

export const PANEL_MIN_WIDTH = 480
export const PANEL_MIN_HEIGHT = 360
