import { app, BrowserWindow, screen, shell, type Display, type Rectangle } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import {
  IPC,
  LAUNCHER_MAX_HEIGHT,
  LAUNCHER_MIN_HEIGHT,
  LAUNCHER_WIDTH,
  PANEL_HEIGHT,
  PANEL_MIN_HEIGHT,
  PANEL_MIN_WIDTH,
  PANEL_WIDTH,
  SEARCH_POSITION_TTL_MS,
  type ShowSearchPayload
} from './types'
import { getAppIcon } from './appIcon'
import type { DesktopPrefsStore } from './prefs'

type PreloadFn = (file: string) => string

type SavedPanelBounds = { x: number; y: number; width: number; height: number }

type SavedSearchBounds = { x: number; y: number; movedAt: number }

type WindowStore = {
  pinned?: boolean
  /** 按显示器 id 记住工具窗位置；进入搜索页时清空 */
  panelByDisplay?: Record<string, SavedPanelBounds>
  /** 按显示器 id 记住搜索窗位置；movedAt=0 表示未手动拖动 */
  searchByDisplay?: Record<string, SavedSearchBounds>
}

/** URL 中 q 参数上限；剪贴板一律走 IPC，避免 base64 图片等撑爆 URL */
const MAX_URL_Q_LEN = 512

/** 单窗 SPA：主进程只管显隐、尺寸；路由由 Nuxt 负责 */
export class WindowManager {
  private shell: BrowserWindow | null = null
  private loaded = false
  private pinned = false
  /** 进入搜索页后，下次打开工具页应重新居中 */
  private resetPanelPositionOnNextOpen = false
  /** 上次搜索窗测得高度，工具 → 搜索时立即缩到该高度，避免先 hide 再 show */
  private lastSearchHeight = LAUNCHER_MIN_HEIGHT
  /** 搜索页已在隐藏窗完成测高，唤起时可直接 show */
  private shellLayoutReady = false
  /** 用户已请求显示，但仍在等待首次测高 */
  private awaitingReveal = false
  private revealMeasureTimer: ReturnType<typeof setTimeout> | null = null
  private resolvedTheme: 'light' | 'dark' = 'light'

  constructor(
    private readonly webBaseUrl: string,
    private readonly preloadPath: PreloadFn,
    private readonly desktopPrefs: DesktopPrefsStore
  ) {
    this.pinned = this.readPinnedFromDisk()
  }

  private windowStorePath(): string {
    return path.join(app.getPath('userData'), 'desktop-window.json')
  }

  private readWindowStore(): WindowStore {
    try {
      const raw = fs.readFileSync(this.windowStorePath(), 'utf8')
      return JSON.parse(raw) as WindowStore
    } catch {
      return {}
    }
  }

  private writeWindowStore(patch: Partial<WindowStore>) {
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      const next = { ...this.readWindowStore(), ...patch }
      if ('panelByDisplay' in patch && patch.panelByDisplay === undefined) {
        delete next.panelByDisplay
      }
      fs.writeFileSync(this.windowStorePath(), JSON.stringify(next))
    } catch (err) {
      console.warn('[Nexus Tools] 无法保存窗口状态', err)
    }
  }

  private readPinnedFromDisk(): boolean {
    return !!this.readWindowStore().pinned
  }

  private writePinnedToDisk() {
    this.writeWindowStore({ pinned: this.pinned })
  }

  private displayIdForBounds(bounds: Rectangle): number {
    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2
    return screen.getDisplayNearestPoint({ x: cx, y: cy }).id
  }

  private getSavedPanelBounds(displayId: number): SavedPanelBounds | null {
    const saved = this.readWindowStore().panelByDisplay?.[String(displayId)]
    if (!saved) return null
    const { x, y, width, height } = saved
    if (![x, y, width, height].every((n) => Number.isFinite(n))) return null
    if (height < PANEL_HEIGHT - 8) return null
    return saved
  }

  private getSavedSearchBounds(displayId: number): SavedSearchBounds | null {
    const saved = this.readWindowStore().searchByDisplay?.[String(displayId)]
    if (!saved) return null
    const { x, y, movedAt } = saved
    if (![x, y, movedAt].every((n) => Number.isFinite(n))) return null
    return saved
  }

  private isSearchPositionFresh(saved: SavedSearchBounds): boolean {
    if (saved.movedAt <= 0) return true
    return Date.now() - saved.movedAt <= SEARCH_POSITION_TTL_MS
  }

  private defaultSearchBounds(height: number, area: Rectangle): Rectangle {
    return {
      x: Math.round(area.x + (area.width - LAUNCHER_WIDTH) / 2),
      y: Math.round(area.y + area.height * 0.18),
      width: LAUNCHER_WIDTH,
      height
    }
  }

  private clampSearchBounds(bounds: Rectangle, area: Rectangle): Rectangle {
    const w = LAUNCHER_WIDTH
    const h = Math.min(
      Math.max(bounds.height, LAUNCHER_MIN_HEIGHT),
      Math.min(LAUNCHER_MAX_HEIGHT, Math.round(area.height * 0.72))
    )
    const x = Math.min(Math.max(bounds.x, area.x), area.x + area.width - w)
    const y = Math.min(Math.max(bounds.y, area.y), area.y + area.height - h)
    return { x: Math.round(x), y: Math.round(y), width: w, height: Math.round(h) }
  }

  private isSearchRoute(url: string): boolean {
    return this.pathnameFromUrl(url).includes('/desktop/search')
  }

  private saveSearchBounds(movedByUser: boolean) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    if (!this.isSearchRoute(win.webContents.getURL())) return
    const bounds = win.getBounds()
    const displayId = this.displayIdForBounds(bounds)
    const store = this.readWindowStore()
    const searchByDisplay = { ...(store.searchByDisplay ?? {}) }
    const existing = searchByDisplay[String(displayId)]
    searchByDisplay[String(displayId)] = {
      x: bounds.x,
      y: bounds.y,
      movedAt: movedByUser ? Date.now() : (existing?.movedAt ?? 0)
    }
    this.writeWindowStore({ searchByDisplay })
  }

  private scheduleSaveSearchBounds = (() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    return () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        this.saveSearchBounds(true)
      }, 200)
    }
  })()

  private resolveSearchBounds(
    win: BrowserWindow,
    height: number,
    opts?: { moveToActiveDisplay?: boolean; reopening?: boolean }
  ): Rectangle {
    const area = this.workArea()
    const displayId = this.activeDisplay().id
    const current = win.getBounds()
    const onActiveDisplay = this.isBoundsCenterInArea(current, area)
    const saved = this.getSavedSearchBounds(displayId)

    if (opts?.moveToActiveDisplay && !onActiveDisplay) {
      if (saved && saved.movedAt > 0 && this.isSearchPositionFresh(saved)) {
        return this.clampSearchBounds({ ...saved, width: LAUNCHER_WIDTH, height }, area)
      }
      return this.defaultSearchBounds(height, area)
    }

    if (opts?.reopening) {
      if (saved && saved.movedAt > 0) {
        if (this.isSearchPositionFresh(saved)) {
          return this.clampSearchBounds({ ...saved, width: LAUNCHER_WIDTH, height }, area)
        }
        return this.defaultSearchBounds(height, area)
      }
      if (onActiveDisplay) {
        return this.clampSearchBounds({ x: current.x, y: current.y, width: LAUNCHER_WIDTH, height }, area)
      }
      return this.defaultSearchBounds(height, area)
    }

    if (onActiveDisplay) {
      return this.clampSearchBounds({ x: current.x, y: current.y, width: LAUNCHER_WIDTH, height }, area)
    }
    return this.defaultSearchBounds(height, area)
  }

  private clearSavedPanelBounds() {
    this.writeWindowStore({ panelByDisplay: undefined })
    this.resetPanelPositionOnNextOpen = true
  }

  private clampPanelBounds(bounds: Rectangle, area: Rectangle): Rectangle {
    const w = Math.min(
      Math.max(bounds.width, PANEL_MIN_WIDTH),
      area.width - 20,
      area.width - 40
    )
    const h = Math.min(
      Math.max(bounds.height, PANEL_MIN_HEIGHT),
      area.height - 20,
      area.height - 40
    )
    const x = Math.min(Math.max(bounds.x, area.x), area.x + area.width - w)
    const y = Math.min(Math.max(bounds.y, area.y), area.y + area.height - h)
    return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
  }

  private savePanelBounds() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    if (!this.isPanelRoute(win.webContents.getURL())) return
    const bounds = win.getBounds()
    if (bounds.height < PANEL_HEIGHT - 8) return
    const displayId = this.displayIdForBounds(bounds)
    const store = this.readWindowStore()
    const panelByDisplay = { ...(store.panelByDisplay ?? {}) }
    panelByDisplay[String(displayId)] = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    }
    this.writeWindowStore({ panelByDisplay })
  }

  private scheduleSavePanelBounds = (() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    return () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        this.savePanelBounds()
      }, 200)
    }
  })()

  isPinned(): boolean {
    return this.pinned
  }

  setPinned(pinned: boolean): boolean {
    const next = !!pinned
    if (this.pinned === next) {
      this.notifyPinState()
      return this.pinned
    }
    this.pinned = next
    this.writePinnedToDisk()
    if (next) {
      const win = this.shell
      if (win && !win.isDestroyed()) this.restoreLauncherOnTop(win)
    }
    this.notifyPinState()
    return this.pinned
  }

  private notifyPinState() {
    const win = this.shell
    if (!win || win.isDestroyed() || !this.loaded) return
    win.webContents.send(IPC.pinChanged, this.pinned)
  }

  /** 光标所在屏幕（多显示器时避免总落在主屏） */
  private activeDisplay(): Display {
    return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  }

  private workArea(): Rectangle {
    return this.activeDisplay().workArea
  }

  /** 搜索窗高度：以渲染层实测为准，上下限与工具页 PANEL_HEIGHT 对齐 */
  private searchHeightFromContent(measured: number): number {
    const viewportCap = Math.round(this.workArea().height * 0.72)
    const maxH = Math.min(LAUNCHER_MAX_HEIGHT, viewportCap)
    const h = Number.isFinite(measured) ? Math.round(measured) : LAUNCHER_MIN_HEIGHT
    return Math.min(maxH, Math.max(LAUNCHER_MIN_HEIGHT, h))
  }

  private searchHeight(win: BrowserWindow, preferred?: number): number {
    const raw = preferred ?? win.getBounds().height ?? LAUNCHER_MIN_HEIGHT
    return this.searchHeightFromContent(raw)
  }

  private applySearchBounds(
    win: BrowserWindow,
    preferredHeight?: number,
    opts?: { moveToActiveDisplay?: boolean; reopening?: boolean; keepCurrentPosition?: boolean }
  ) {
    const area = this.workArea()
    const maxH = Math.min(LAUNCHER_MAX_HEIGHT, Math.round(area.height * 0.72))
    const height = this.searchHeight(win, preferredHeight)
    const current = win.getBounds()

    win.setMinimumSize(LAUNCHER_WIDTH, LAUNCHER_MIN_HEIGHT)
    win.setMaximumSize(LAUNCHER_WIDTH, maxH)
    win.setResizable(false)

    const next = opts?.keepCurrentPosition
      ? this.clampSearchBounds({ x: current.x, y: current.y, width: LAUNCHER_WIDTH, height }, area)
      : this.resolveSearchBounds(win, height, opts)

    if (!this.boundsApproximatelyEqual(current, next)) {
      win.setBounds(next, false)
    }
  }

  private isAutoHideOnBlurEnabled(): boolean {
    return this.desktopPrefs.read().autoHideOnBlur !== false
  }

  /** 焦点在任意本应用窗口上时不应因失焦而隐藏（避免 window.open 子窗触发 app.hide） */
  private isFocusedOnAppWindow(): boolean {
    const focused = BrowserWindow.getFocusedWindow()
    if (!focused || focused.isDestroyed()) return false
    return BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && w.id === focused.id)
  }

  private attachExternalLinkHandler(win: BrowserWindow) {
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        void shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  }

  private restoreLauncherOnTop(win: BrowserWindow) {
    if (win.isDestroyed()) return
    win.setAlwaysOnTop(true, 'floating')
  }

  /** 图钉：保持置顶；自动隐藏开：收起窗口；自动隐藏关：取消置顶，由其他窗口覆盖 */
  private handleFocusLoss() {
    if (process.env.NEXUS_KEEP_VISIBLE === '1') return

    const win = this.shell
    if (!win || win.isDestroyed() || !this.isShellVisible()) return

    if (this.pinned) return

    this.savePanelBounds()
    this.saveSearchBounds(false)

    if (this.isAutoHideOnBlurEnabled()) {
      this.hide()
      return
    }

    win.setAlwaysOnTop(false)
  }

  private ensureShell(): BrowserWindow {
    if (this.shell && !this.shell.isDestroyed()) return this.shell

    const area = this.workArea()
    const icon = getAppIcon()
    const initialBounds = {
      x: Math.round(area.x + (area.width - LAUNCHER_WIDTH) / 2),
      y: Math.round(area.y + area.height * 0.18),
      width: LAUNCHER_WIDTH,
      height: LAUNCHER_MIN_HEIGHT
    }

    this.shell = new BrowserWindow({
      ...initialBounds,
      frame: false,
      transparent: false,
      resizable: false,
      alwaysOnTop: true,
      show: false,
      backgroundColor: '#ffffff',
      ...(icon ? { icon } : {}),
      webPreferences: {
        preload: this.preloadPath('preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    this.attachExternalLinkHandler(this.shell)

    // 失焦：图钉保持置顶；自动隐藏开则收起；自动隐藏关则沉到其他窗口下方
    this.shell.on('blur', () => {
      if (process.env.NEXUS_KEEP_VISIBLE === '1' || this.pinned) return
      const win = this.shell
      if (!win || win.isDestroyed()) return
      setTimeout(() => {
        if (win.isDestroyed() || !this.isShellVisible()) return
        if (BrowserWindow.getFocusedWindow() === win) return
        if (this.isFocusedOnAppWindow()) return
        this.handleFocusLoss()
      }, 50)
    })

    this.shell.on('focus', () => {
      const win = this.shell
      if (!win || win.isDestroyed()) return
      this.restoreLauncherOnTop(win)
    })

    this.shell.webContents.on('before-input-event', (_event, input) => {
      if (process.env.NEXUS_KEEP_VISIBLE === '1' || this.pinned) return
      if (input.type !== 'keyDown') return
      if (process.platform === 'darwin' && input.meta && input.key === 'Tab') {
        this.handleFocusLoss()
      }
    })

    this.shell.on('moved', () => {
      this.scheduleSavePanelBounds()
      this.scheduleSaveSearchBounds()
    })
    this.shell.on('resized', () => this.scheduleSavePanelBounds())

    this.shell.on('closed', () => {
      this.shell = null
      this.loaded = false
      this.shellLayoutReady = false
      this.awaitingReveal = false
      this.clearRevealMeasureTimer()
    })

    this.shell.webContents.on('did-finish-load', () => {
      this.loaded = true
      this.notifyPinState()
    })

    this.shell.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[Nexus Tools] 页面加载失败 (${code}): ${desc}\n  ${url}`)
      console.error('[Nexus Tools] 开发模式请先 cd web-tools && npm run dev，再运行 desktop:dev')
    })

    return this.shell
  }

  private pageUrl(pathname: string) {
    return new URL(pathname, this.webBaseUrl).toString()
  }

  private themeBackground(): string {
    return this.resolvedTheme === 'dark' ? '#1c1c1e' : '#ffffff'
  }

  setResolvedTheme(theme: 'light' | 'dark') {
    this.resolvedTheme = theme
    this.syncWindowBackground()
  }

  private syncWindowBackground() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    win.setBackgroundColor(this.themeBackground())
  }

  private searchUrl(q = '') {
    const url = new URL('/desktop/search', this.webBaseUrl)
    const safeQ = q.trim()
    if (safeQ && safeQ.length <= MAX_URL_Q_LEN) {
      url.searchParams.set('q', safeQ)
    }
    return url.toString()
  }

  applySearchChrome(opts?: { moveToActiveDisplay?: boolean; reopening?: boolean }) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    this.clearSavedPanelBounds()
    win.setBackgroundColor(this.themeBackground())
    const current = win.getBounds()
    const fromPanel = current.height > PANEL_HEIGHT * 0.75
    const height = fromPanel
      ? this.lastSearchHeight
      : this.searchHeight(win, current.height)
    this.applySearchBounds(win, height, opts)
  }

  /** 窗口中心是否落在指定工作区内（用于判断是否需要按当前屏重新居中） */
  private isBoundsCenterInArea(bounds: Rectangle, area: Rectangle): boolean {
    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2
    return (
      cx >= area.x &&
      cx <= area.x + area.width &&
      cy >= area.y &&
      cy <= area.y + area.height
    )
  }

  private centeredPanelBounds(w: number, h: number, area: Rectangle): Rectangle {
    return {
      x: Math.round(area.x + (area.width - w) / 2),
      y: Math.round(area.y + (area.height - h) / 2),
      width: w,
      height: h
    }
  }

  private boundsApproximatelyEqual(a: Rectangle, b: Rectangle): boolean {
    return (
      Math.abs(a.x - b.x) <= 1 &&
      Math.abs(a.y - b.y) <= 1 &&
      Math.abs(a.width - b.width) <= 1 &&
      Math.abs(a.height - b.height) <= 1
    )
  }

  applyPanelChrome(
    width: number,
    height: number,
    opts?: { centerOnActiveDisplay?: boolean }
  ) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    win.setBackgroundColor(this.themeBackground())
    const area = this.workArea()
    const displayId = this.activeDisplay().id
    const w = Math.min(width, area.width - 40)
    const h = Math.min(height, area.height - 40)
    win.setMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT)
    win.setMaximumSize(area.width - 20, area.height - 20)
    win.setResizable(true)

    const current = win.getBounds()
    const saved = this.getSavedPanelBounds(displayId)
    const onActiveDisplay = this.isBoundsCenterInArea(current, area)

    let next: Rectangle
    if (opts?.centerOnActiveDisplay || !onActiveDisplay) {
      next = this.centeredPanelBounds(w, h, area)
      this.resetPanelPositionOnNextOpen = false
    } else if (this.resetPanelPositionOnNextOpen || current.height < h - 8) {
      next = this.clampPanelBounds(
        { x: current.x, y: current.y, width: w, height: h },
        area
      )
      this.resetPanelPositionOnNextOpen = false
    } else if (saved) {
      next = this.clampPanelBounds(
        saved.height >= h - 8 ? saved : { x: saved.x, y: saved.y, width: w, height: h },
        area
      )
    } else {
      next = this.clampPanelBounds({ x: current.x, y: current.y, width: w, height: h }, area)
    }

    if (!this.boundsApproximatelyEqual(current, next)) {
      win.setBounds(next, false)
    }
  }

  private clearRevealMeasureTimer() {
    if (this.revealMeasureTimer) {
      clearTimeout(this.revealMeasureTimer)
      this.revealMeasureTimer = null
    }
  }

  private finishAwaitingReveal(win: BrowserWindow) {
    if (!this.awaitingReveal || win.isDestroyed()) return
    this.awaitingReveal = false
    this.clearRevealMeasureTimer()
    this.showAndFocus(win)
  }

  private revealSearchWindow(win: BrowserWindow) {
    if (this.shellLayoutReady) {
      this.showAndFocus(win)
      return
    }
    this.awaitingReveal = true
    this.clearRevealMeasureTimer()
    this.revealMeasureTimer = setTimeout(() => this.finishAwaitingReveal(win), 480)
    win.once('closed', () => this.clearRevealMeasureTimer())
  }

  /** macOS 用 app.hide/show（等同 ⌘H），Cmd+Tab / 台前调度才能正确恢复 */
  private isShellVisible(): boolean {
    const win = this.shell
    if (!win || win.isDestroyed()) return false
    if (process.platform === 'darwin') return !app.isHidden() && win.isVisible()
    return win.isVisible()
  }

  /**
   * macOS 台前调度：优先 win.show + 弱抢焦，避免首次 app.show() 把整个分组顶到最前。
   * app.hide() 后若窗口仍不出现，再回退 app.show()。
   */
  private showAndFocus(win: BrowserWindow) {
    if (win.isDestroyed()) return
    this.restoreLauncherOnTop(win)
    if (process.platform === 'darwin') {
      if (app.isHidden()) win.show()
      else if (!win.isVisible()) win.show()
      try {
        app.focus({ steal: false })
      } catch {
        /* older Electron */
      }
      if (!win.isVisible()) app.show()
      win.focus()
      return
    }
    if (!win.isVisible()) win.show()
    win.focus()
  }

  resizeSearch(contentHeight: number) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    if (!Number.isFinite(contentHeight)) return
    const height = this.searchHeightFromContent(contentHeight)
    this.lastSearchHeight = height
    this.applySearchBounds(win, height, { keepCurrentPosition: true })
    if (!this.shellLayoutReady) {
      this.shellLayoutReady = true
      this.finishAwaitingReveal(win)
    }
  }

  /** 启动后预加载搜索页（不显示），减轻首次快捷键/启动时的冷启动与台前调度干扰 */
  prewarmSearchShell() {
    const win = this.ensureShell()
    const target = this.searchUrl()
    const current = win.webContents.getURL()
    if (this.loaded && current.includes('/desktop/search')) return
    win.loadURL(target)
  }

  showSettings() {
    const win = this.ensureShell()
    const target = this.pageUrl('/desktop/settings')
    const reveal = () => {
      this.setPanelMode('/desktop/settings')
      this.showAndFocus(win)
    }

    const onSettingsPage = win.webContents.getURL().includes('/desktop/settings')
    if (!this.loaded || !onSettingsPage) {
      win.loadURL(target)
      win.webContents.once('did-finish-load', reveal)
    } else {
      reveal()
    }
  }

  showSearch(input: ShowSearchPayload = {}) {
    const { clipboard = '', q = '', source = 'hotkey' } = input
    const win = this.ensureShell()
    this.applySearchChrome({ moveToActiveDisplay: true, reopening: true })

    const target = this.searchUrl(q)
    const current = win.webContents.getURL()
    const onSearchPage = current.includes('/desktop/search')

    const reveal = () => {
      this.applySearchChrome({ moveToActiveDisplay: true, reopening: true })
      this.revealSearchWindow(win)
      win.webContents.send('desktop:show-search', { clipboard, q, source })
    }

    if (!this.loaded || !onSearchPage) {
      win.loadURL(target)
      win.webContents.once('did-finish-load', reveal)
    } else {
      reveal()
    }
  }

  hide() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    this.savePanelBounds()
    this.saveSearchBounds(false)
    if (process.platform === 'darwin') {
      app.hide()
      return
    }
    win.hide()
  }

  private pathnameFromUrl(url: string): string {
    try {
      return new URL(url).pathname
    } catch {
      const m = url.match(/^https?:\/\/[^/]+(\/[^?#]*)/)
      return m?.[1] ?? ''
    }
  }

  /** 工具页 / 工具集：不重新加载，仅恢复窗口尺寸与焦点 */
  private isPanelRoute(url: string): boolean {
    const path = this.pathnameFromUrl(url)
    return path.startsWith('/tools/') || path === '/desktop/settings'
  }

  revealPanel() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    const path = this.pathnameFromUrl(win.webContents.getURL())
    if (this.isPanelRoute(win.webContents.getURL())) {
      this.setPanelMode(path)
    }
    this.showAndFocus(win)
  }

  /** 窗口隐藏时恢复显示（快捷键 / Dock / 应用切换器共用） */
  private revealWhenHidden(clipboard = '') {
    const payload: ShowSearchPayload = { clipboard, source: 'hotkey' }
    const win = this.shell
    if (!win || win.isDestroyed()) {
      this.showSearch(payload)
      return
    }

    const url = win.webContents.getURL()
    if (this.loaded && this.isPanelRoute(url)) {
      this.revealPanel()
      return
    }

    this.showSearch(payload)
  }

  /** Dock / 菜单栏图标 / Cmd+Tab 切回本应用时恢复窗口 */
  activateFromUser(clipboard = '') {
    const win = this.shell
    if (!win || win.isDestroyed()) {
      this.showSearch({ clipboard, source: 'hotkey' })
      return
    }

    if (this.isShellVisible()) {
      win.focus()
      return
    }

    this.revealWhenHidden(clipboard)
  }

  /**
   * 全局快捷键：显隐切换。
   * - 窗口可见：隐藏
   * - 隐藏后唤起：若上次在工具/工具集，仅恢复该页；否则打开搜索并带入剪贴板
   */
  toggleSearch(clipboard = '') {
    const win = this.shell
    if (!win || win.isDestroyed()) {
      this.showSearch({ clipboard, source: 'hotkey' })
      return
    }

    if (this.isShellVisible()) {
      this.hide()
      return
    }

    this.revealWhenHidden(clipboard)
  }

  panelSizeForPath(path: string) {
    return { width: PANEL_WIDTH, height: PANEL_HEIGHT }
  }

  setPanelMode(path: string, opts?: { centerOnActiveDisplay?: boolean }) {
    const size = this.panelSizeForPath(path)
    this.applyPanelChrome(size.width, size.height, opts)
  }

  closeFromRenderer() {
    this.hide()
  }
}
