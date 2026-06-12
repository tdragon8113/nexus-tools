import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, nativeTheme, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { resolveDevWebUrl } from './resolveWebUrl'
import { startStaticServer } from './staticServer'
import { MAX_CLIPBOARD_TEXT_CHARS } from './clipboardLimits'
import { applyOpenAtLogin, getOpenAtLoginFromSystem } from './loginItem'
import { applyPrefsPatch } from './prefsPatch'
import { DesktopPrefsStore, type DesktopPrefs } from './prefs'
import { clearMacAppQuarantine } from './macQuarantine'
import { AppUpdaterService } from './updater'
import { setupAppTray } from './trayManager'
import { listMacApplications } from './macApps'
import { getMacAppIconDataUrl } from './macAppIcon'
import { TotpAccountStore } from './totpAccountStore'
import {
  getAccessibilityStatus,
  openAccessibilitySettings,
  requestAccessibilityPermission,
  warmUpKeyboardAutomation
} from './totpAutofill'
import { RendererLocalStateStore } from './rendererLocalStateStore'
import { TotpShortcutManager } from './totpShortcutManager'
import { WindowManager } from './windowManager'
import { setupGeolocationPermissions } from './geolocationSetup'
import { fetchIpLookupWithOptions, getSystemProxyStatus } from './ipLookupProxy'
import { IPC } from './types'
import type { StoredTotpAccount } from '../../utils/totp'

const isDev = process.env.NEXUS_WEB_DEV === '1'
const HOTKEY = process.env.NEXUS_HOTKEY ?? 'Alt+Space'

if (process.platform === 'darwin') {
  app.setName('Nexus Tools')
}

function openExternalHttpUrl(raw: unknown): boolean {
  if (typeof raw !== 'string' || !raw.trim()) return false
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    void shell.openExternal(url.toString())
    return true
  } catch {
    return false
  }
}

ipcMain.handle(IPC.ipProxyStatus, () => getSystemProxyStatus())
ipcMain.handle(IPC.openExternal, (_e, url: unknown) => openExternalHttpUrl(url))
ipcMain.handle(IPC.ipLookup, (_e, payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return fetchIpLookupWithOptions()
  }
  const body = payload as { ip?: unknown; useSystemProxy?: unknown }
  return fetchIpLookupWithOptions({
    ip: typeof body.ip === 'string' ? body.ip : undefined,
    useSystemProxy: body.useSystemProxy === true
  })
})

function readClipboardForSearch(): string {
  const raw = clipboard.readText().trim()
  if (raw.length <= MAX_CLIPBOARD_TEXT_CHARS) return raw
  let cut = raw.slice(0, MAX_CLIPBOARD_TEXT_CHARS)
  const rem = cut.length % 4
  if (rem) cut = cut.slice(0, cut.length - rem)
  return cut
}

function resolveThemeFromPrefs(prefs: DesktopPrefs): 'light' | 'dark' {
  if (prefs.theme === 'light') return 'light'
  if (prefs.theme === 'dark') return 'dark'
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

const distDir = path.join(__dirname)
let webBaseUrl = ''
let staticServerClose: (() => void) | null = null
let windows: WindowManager | null = null
const desktopPrefs = new DesktopPrefsStore()
let appUpdater: AppUpdaterService | null = null
let appTray: ReturnType<typeof setupAppTray> = null
const totpAccountStore = new TotpAccountStore()
const rendererLocalStateStore = new RendererLocalStateStore()
let totpShortcuts: TotpShortcutManager | null = null

function syncTotpShortcutAccounts() {
  if (!totpShortcuts) return
  totpShortcuts.pruneOrphanShortcuts(new Set(totpAccountStore.list().map((row) => row.id)))
  totpShortcuts.reload()
}

function allBrowserWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
}

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
  await clearMacAppQuarantine()
  setupGeolocationPermissions()

  try {
    webBaseUrl = await resolveWebBaseUrl()
  } catch (err) {
    console.error('[Nexus Tools] 请先执行: cd web-tools && npm run generate')
    app.quit()
    return
  }

  windows = new WindowManager(webBaseUrl, preloadPath, desktopPrefs)
  windows.setResolvedTheme(resolveThemeFromPrefs(desktopPrefs.read()))

  totpAccountStore.loadFromDisk()
  totpShortcuts = new TotpShortcutManager({
    prefs: desktopPrefs,
    accountStore: totpAccountStore,
    hideWindow: () => windows?.hide(),
    mainSearchHotkey: HOTKEY
  })
  syncTotpShortcutAccounts()
  warmUpKeyboardAutomation()

  const ok = globalShortcut.register(HOTKEY, () => {
    windows?.toggleSearch(readClipboardForSearch())
  })
  if (!ok) console.error(`[Nexus Tools] 快捷键注册失败: ${HOTKEY}`)

  ipcMain.on(IPC.searchResize, (_e, h: number) => {
    if (typeof h === 'number' && Number.isFinite(h)) windows?.resizeSearch(h)
  })
  ipcMain.on(IPC.searchMode, () => windows?.applySearchChrome())
  ipcMain.on(IPC.windowThemeSync, (_e, theme: unknown) => {
    if (theme === 'light' || theme === 'dark') windows?.setResolvedTheme(theme)
  })
  ipcMain.handle(IPC.panelMode, (_e, p: unknown) => {
    if (typeof p === 'string') windows?.setPanelMode(p)
  })
  ipcMain.on(IPC.close, () => windows?.closeFromRenderer())
  ipcMain.handle(IPC.pinGet, () => windows?.isPinned() ?? false)
  ipcMain.handle(IPC.pinSet, (_e, pinned: unknown) => {
    if (typeof pinned === 'boolean') windows?.setPinned(pinned)
    return windows?.isPinned() ?? false
  })
  ipcMain.handle(IPC.clipboardPrefsGet, () => {
    const prefs = desktopPrefs.read()
    return { ...prefs, openAtLogin: getOpenAtLoginFromSystem() }
  })
  appUpdater = new AppUpdaterService(allBrowserWindows)

  ipcMain.handle(IPC.clipboardPrefsPatch, (_e, patch: unknown) => {
    if (!patch || typeof patch !== 'object') return desktopPrefs.read()
    return applyPrefsPatch(desktopPrefs, patch as Record<string, unknown>, { appUpdater })
  })
  ipcMain.handle(IPC.clipboardWriteText, (_e, text: unknown) => {
    if (typeof text !== 'string') return false
    clipboard.writeText(text)
    return true
  })
  const prefs = desktopPrefs.read()
  appUpdater.setAutoUpdateEnabled(prefs.autoUpdateEnabled !== false)
  appUpdater.init()

  if (prefs.openAtLogin === true) {
    applyOpenAtLogin(true)
  }

  ipcMain.handle(IPC.updaterGetState, () => appUpdater?.getState() ?? { status: 'idle', currentVersion: app.getVersion() })
  ipcMain.handle(IPC.updaterCheck, () => appUpdater?.check() ?? { status: 'idle', currentVersion: app.getVersion() })
  ipcMain.handle(IPC.updaterDownload, () => appUpdater?.download() ?? { status: 'idle', currentVersion: app.getVersion() })
  ipcMain.on(IPC.updaterInstall, () => appUpdater?.install())
  ipcMain.on(IPC.updaterOpenRelease, () => appUpdater?.openReleasePage())

  ipcMain.handle(IPC.macAppsList, () => listMacApplications())
  ipcMain.handle(IPC.macAppGetIcon, async (_e, appPath: unknown) => {
    if (typeof appPath !== 'string' || !appPath.endsWith('.app')) return null
    return getMacAppIconDataUrl(appPath)
  })
  ipcMain.handle(IPC.macAppOpen, async (_e, appPath: unknown) => {
    if (typeof appPath !== 'string' || !appPath.endsWith('.app')) return false
    const err = await shell.openPath(appPath)
    return err === ''
  })

  ipcMain.handle(IPC.totpGetAccounts, () => totpAccountStore.list())
  ipcMain.handle(IPC.totpSyncAccounts, (_e, accounts: unknown) => {
    if (!Array.isArray(accounts)) return totpAccountStore.list()
    const saved = totpAccountStore.saveAccounts(accounts as StoredTotpAccount[])
    syncTotpShortcutAccounts()
    return saved
  })
  ipcMain.handle(IPC.totpGetShortcuts, () => totpShortcuts?.getShortcuts() ?? {})
  ipcMain.handle(IPC.totpSetShortcut, (_e, payload: unknown) => {
    if (!totpShortcuts || !payload || typeof payload !== 'object') {
      return { ok: false, error: 'invalid' }
    }
    const { accountId, accelerator } = payload as { accountId?: unknown; accelerator?: unknown }
    if (typeof accountId !== 'string') return { ok: false, error: 'invalid' }
    const next =
      accelerator === null || accelerator === undefined || accelerator === ''
        ? null
        : typeof accelerator === 'string'
          ? accelerator
          : null
    return totpShortcuts.setShortcut(accountId, next)
  })
  ipcMain.handle(IPC.totpSetShortcutCapture, (_e, active: unknown) => {
    if (typeof active !== 'boolean') return false
    totpShortcuts?.setCaptureActive(active)
    return true
  })
  ipcMain.handle(IPC.totpOpenAccessibility, () => requestAccessibilityPermission())
  ipcMain.handle(IPC.totpOpenAccessibilitySettings, () => {
    openAccessibilitySettings()
    return getAccessibilityStatus()
  })
  ipcMain.handle(IPC.totpGetAccessibility, () => getAccessibilityStatus())

  ipcMain.handle(IPC.rendererLocalStateGet, () => rendererLocalStateStore.read())
  ipcMain.handle(IPC.rendererLocalStatePatch, (_e, patch: unknown) => {
    if (!patch || typeof patch !== 'object') return rendererLocalStateStore.read()
    return rendererLocalStateStore.patch(patch as Record<string, string>)
  })

  if (process.platform === 'darwin') {
    void listMacApplications()
    app.dock?.hide()
  }

  appTray = setupAppTray({
    hotkey: HOTKEY,
    prefs: desktopPrefs,
    prefsPatchDeps: { appUpdater },
    onSearch: () => windows?.activateFromUser(readClipboardForSearch()),
    onSettings: () => windows?.showSettings(),
    onCheckUpdate: () => {
      void appUpdater?.check()
      windows?.showSettings()
    }
  })

  windows.prewarmSearchShell()

  console.log(`[Nexus Tools] 已启动 · ${webBaseUrl} · ${HOTKEY} 唤起搜索`)
})

if (process.platform === 'darwin') {
  app.on('activate', () => {
    windows?.activateFromUser(readClipboardForSearch())
  })
}

app.on('will-quit', () => {
  appTray?.dispose()
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
    windows?.activateFromUser(readClipboardForSearch())
  })
}
