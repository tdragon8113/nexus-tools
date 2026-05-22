import { app, BrowserWindow, clipboard, globalShortcut, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { applyDockIcon } from './appIcon'
import { IPC } from './types'
import { resolveDevWebUrl } from './resolveWebUrl'
import { startStaticServer } from './staticServer'
import { WindowManager } from './windowManager'

const isDev = process.env.NEXUS_WEB_DEV === '1'
const HOTKEY = process.env.NEXUS_HOTKEY ?? 'Alt+Space'

const distDir = path.join(__dirname)
let webBaseUrl = ''
let staticServerClose: (() => void) | null = null
let windows: WindowManager | null = null

function preloadPath(file: string) {
  return path.join(distDir, file)
}

async function resolveWebBaseUrl(): Promise<string> {
  if (isDev) {
    return resolveDevWebUrl()
  }
  const packagedWeb = path.join(process.resourcesPath, 'web')
  const devBuildWeb = path.join(distDir, '..', '..', '.output', 'public')
  const staticRoot = fs.existsSync(packagedWeb) ? packagedWeb : devBuildWeb
  const server = await startStaticServer(staticRoot)
  staticServerClose = server.close
  return `http://127.0.0.1:${server.port}`
}

app.whenReady().then(async () => {
  try {
    webBaseUrl = await resolveWebBaseUrl()
  } catch (err) {
    console.error('[Nexus Tools] 请先执行: cd web-tools && npm run generate')
    app.quit()
    return
  }

  windows = new WindowManager(webBaseUrl, preloadPath)

  const ok = globalShortcut.register(HOTKEY, () => {
    windows?.toggleSearch(clipboard.readText().trim())
  })
  if (!ok) console.error(`[Nexus Tools] 快捷键注册失败: ${HOTKEY}`)

  ipcMain.on(IPC.searchResize, (_e, h: number) => {
    if (typeof h === 'number' && Number.isFinite(h)) windows?.resizeSearch(h)
  })
  ipcMain.on(IPC.searchMode, () => windows?.applySearchChrome())
  ipcMain.on(IPC.panelMode, (_e, p: string) => {
    if (typeof p === 'string') windows?.setPanelMode(p)
  })
  ipcMain.on(IPC.close, () => windows?.closeFromRenderer())

  if (process.platform === 'darwin') {
    app.dock?.show()
    applyDockIcon()
  }

  console.log(`[Nexus Tools] 已启动 · ${webBaseUrl} · ${HOTKEY} 唤起搜索`)
  windows.showSearch(clipboard.readText().trim())
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  staticServerClose?.()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    windows?.toggleSearch(clipboard.readText().trim())
  })
}
