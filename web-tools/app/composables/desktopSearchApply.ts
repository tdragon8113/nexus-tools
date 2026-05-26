/** 桌面搜索页挂载后注册；stage 剪贴板后触发，避免 IPC 早于组件 mount 导致未识别 */
let applyHandler: (() => void) | null = null

export function registerDesktopSearchApply(handler: () => void) {
  applyHandler = handler
}

export function unregisterDesktopSearchApply(handler: () => void) {
  if (applyHandler === handler) applyHandler = null
}

export function triggerDesktopSearchApply() {
  if (!import.meta.client) return
  queueMicrotask(() => applyHandler?.())
}
