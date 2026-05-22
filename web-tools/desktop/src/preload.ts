import { contextBridge, ipcRenderer } from 'electron'
import type { OpenToolPayload } from './types'
import { IPC } from './types'

type ShowSearchPayload = { clipboard?: string; q?: string }

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
    ipcRenderer.send(IPC.panelMode, path)
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
  }
})
