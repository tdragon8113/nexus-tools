import { app, BrowserWindow, clipboard, globalShortcut, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { applyDockIcon } from './appIcon'
import { IPC } from './types'
import { resolveDevWebUrl } from './resolveWebUrl'
import { startStaticServer } from './staticServer'
import { MAX_CLIPBOARD_TEXT_CHARS } from './clipboardLimits'
import { DesktopPrefsStore } from './prefs'
import { WindowManager } from './windowManager'

const isDev = process.env.NEXUS_WEB_DEV === '1'
const HOTKEY = process.env.NEXUS_HOTKEY ?? 'Alt+Space'

function readClipboardForSearch(): string {
  const raw = clipboard.readText().trim()
  if (raw.length <= MAX_CLIPBOARD_TEXT_CHARS) return raw
  let cut = raw.slice(0, MAX_CLIPBOARD_TEXT_CHARS)
  const rem = cut.length % 4
  if (rem) cut = cut.slice(0, cut.length - rem)
  return cut
}

const distDir = path.join(__dirname)
let webBaseUrl = ''
let staticServerClose: (() => void) | null = null
let windows: WindowManager | null = null
const desktopPrefs = new DesktopPrefsStore()

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
    windows?.toggleSearch(readClipboardForSearch())
  })
  if (!ok) console.error(`[Nexus Tools] 快捷键注册失败: ${HOTKEY}`)

  ipcMain.on(IPC.searchResize, (_e, h: number) => {
    if (typeof h === 'number' && Number.isFinite(h)) windows?.resizeSearch(h)
  })
  ipcMain.on(IPC.searchMode, () => windows?.applySearchChrome())
  ipcMain.handle(IPC.panelMode, (_e, p: unknown) => {
    if (typeof p === 'string') windows?.setPanelMode(p)
  })
  ipcMain.on(IPC.close, () => windows?.closeFromRenderer())
  ipcMain.handle(IPC.pinGet, () => windows?.isPinned() ?? false)
  ipcMain.handle(IPC.pinSet, (_e, pinned: unknown) => {
    if (typeof pinned === 'boolean') windows?.setPinned(pinned)
    return windows?.isPinned() ?? false
  })
  ipcMain.handle(IPC.clipboardPrefsGet, () => desktopPrefs.read())
  ipcMain.handle(IPC.clipboardPrefsPatch, (_e, patch: unknown) => {
    if (!patch || typeof patch !== 'object') return desktopPrefs.read()
    const p = patch as Record<string, unknown>
    const next: Partial<ReturnType<DesktopPrefsStore['read']>> = {}
    if (p.clipboardPolicy === 'smart' || p.clipboardPolicy === 'always' || p.clipboardPolicy === 'never') {
      next.clipboardPolicy = p.clipboardPolicy
    }
    if (typeof p.lastAppliedClipboardHash === 'string') {
      next.lastAppliedClipboardHash = p.lastAppliedClipboardHash
    }
    if (typeof p.dismissedClipboardHash === 'string') {
      next.dismissedClipboardHash = p.dismissedClipboardHash
    }
    return desktopPrefs.write(next)
  })

  if (process.platform === 'darwin') {
    app.dock?.show()
    applyDockIcon()
  }

  console.log(`[Nexus Tools] 已启动 · ${webBaseUrl} · ${HOTKEY} 唤起搜索`)
  windows.showSearch({ clipboard: readClipboardForSearch(), source: 'hotkey' })
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
    windows?.toggleSearch(readClipboardForSearch())
  })
}
