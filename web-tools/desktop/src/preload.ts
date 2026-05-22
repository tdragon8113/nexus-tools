import { contextBridge, ipcRenderer } from 'electron'
import type { OpenToolPayload } from './types'
import { IPC } from './types'

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
    ipcRenderer.send(IPC.panelMode, path)
  },
  onShowSearch(handler: (payload: { clipboard?: string; q?: string }) => void) {
    const channel = 'desktop:show-search'
    const listener = (_e: unknown, payload: { clipboard?: string; q?: string }) =>
      handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onOpenTool(handler: (payload: OpenToolPayload) => void) {
    const channel = 'desktop:open-tool'
    const listener = (_e: unknown, payload: OpenToolPayload) => handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
})
