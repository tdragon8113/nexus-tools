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
  clipboardPrefsPatch: 'desktop:clipboard-prefs-patch'
} as const

export type ClipboardOpenSource = 'hotkey' | 'navigation'

export type ShowSearchPayload = {
  clipboard?: string
  q?: string
  source?: ClipboardOpenSource
}

/** 搜索窗 / 工具集 / 工具页统一外框宽度（与白色圆角面板一致） */
export const DESKTOP_FRAME_WIDTH = 800

export const LAUNCHER_WIDTH = DESKTOP_FRAME_WIDTH
/** 搜索窗可缩放下限（须能容纳顶栏 + 输入框；实际高度以内容测量为准） */
export const LAUNCHER_MIN_HEIGHT = 88

/** 工具集与所有工具页统一窗口尺寸 */
export const PANEL_WIDTH = DESKTOP_FRAME_WIDTH
export const PANEL_HEIGHT = 600

export const PANEL_MIN_WIDTH = 480
export const PANEL_MIN_HEIGHT = 360
