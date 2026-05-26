import { app, BrowserWindow, screen, type Display, type Rectangle } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import {
  IPC,
  LAUNCHER_MIN_HEIGHT,
  LAUNCHER_WIDTH,
  PANEL_HEIGHT,
  PANEL_MIN_HEIGHT,
  PANEL_MIN_WIDTH,
  PANEL_WIDTH,
  type ShowSearchPayload
} from './types'
import { getAppIcon } from './appIcon'

type PreloadFn = (file: string) => string

type SavedPanelBounds = { x: number; y: number; width: number; height: number }

type WindowStore = {
  pinned?: boolean
  /** 按显示器 id 记住工具窗位置；进入搜索页时清空 */
  panelByDisplay?: Record<string, SavedPanelBounds>
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
  /** 冷启动：等渲染层首次测高后再 show，避免先矮窗后撑开闪一下 */
  private deferShowUntilSearchMeasured = true

  constructor(
    private readonly webBaseUrl: string,
    private readonly preloadPath: PreloadFn
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

  /** 搜索窗高度：以内容测量为准，仅做上下限裁剪（避免 LAUNCHER_MIN 撑出底部空白条） */
  private searchHeightFromContent(measured: number): number {
    const maxH = Math.round(this.workArea().height * 0.65)
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
    opts?: { keepPosition?: boolean }
  ) {
    const area = this.workArea()
    const maxH = Math.round(area.height * 0.65)
    const height = this.searchHeight(win, preferredHeight)
    const current = win.getBounds()

    // 宽高上下限一致，避免从可调整大小的工具面板切回时仍保持过宽尺寸
    win.setMinimumSize(LAUNCHER_WIDTH, LAUNCHER_MIN_HEIGHT)
    win.setMaximumSize(LAUNCHER_WIDTH, maxH)
    win.setResizable(false)
    const next = opts?.keepPosition
      ? { x: current.x, y: current.y, width: LAUNCHER_WIDTH, height }
      : {
          x: Math.round(area.x + (area.width - LAUNCHER_WIDTH) / 2),
          y: Math.round(area.y + area.height * 0.18),
          width: LAUNCHER_WIDTH,
          height
        }
    if (!this.boundsApproximatelyEqual(current, next)) {
      win.setBounds(next, false)
    }
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

    // 点击窗口外失焦时隐藏（uTools 式）；图钉开启时保持显示
    this.shell.on('blur', () => {
      if (process.env.NEXUS_KEEP_VISIBLE === '1' || this.pinned) return
      const win = this.shell
      if (!win || win.isDestroyed()) return
      setTimeout(() => {
        if (win.isDestroyed() || !win.isVisible() || this.pinned) return
        const focused = BrowserWindow.getFocusedWindow()
        if (focused === win) return
        this.savePanelBounds()
        this.hide()
      }, 200)
    })

    this.shell.on('moved', () => this.scheduleSavePanelBounds())
    this.shell.on('resized', () => this.scheduleSavePanelBounds())

    this.shell.on('closed', () => {
      this.shell = null
      this.loaded = false
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

  private searchUrl(q = '') {
    const url = new URL('/desktop/search', this.webBaseUrl)
    const safeQ = q.trim()
    if (safeQ && safeQ.length <= MAX_URL_Q_LEN) {
      url.searchParams.set('q', safeQ)
    }
    return url.toString()
  }

  applySearchChrome() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    this.clearSavedPanelBounds()
    win.setBackgroundColor('#ffffff')
    const current = win.getBounds()
    const fromPanel = current.height > PANEL_HEIGHT * 0.75
    const height = fromPanel
      ? this.lastSearchHeight
      : this.searchHeight(win, current.height)
    const keepPosition = fromPanel || win.isVisible()
    this.applySearchBounds(win, height, { keepPosition })
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
    win.setBackgroundColor('#ffffff')
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

  private revealSearchWindow(win: BrowserWindow) {
    if (!this.deferShowUntilSearchMeasured) {
      win.show()
      win.focus()
      return
    }
    const fallback = setTimeout(() => {
      if (!this.deferShowUntilSearchMeasured) return
      if (win.isDestroyed()) return
      this.deferShowUntilSearchMeasured = false
      win.show()
      win.focus()
    }, 480)
    win.once('closed', () => clearTimeout(fallback))
  }

  resizeSearch(contentHeight: number) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    if (!Number.isFinite(contentHeight)) return
    const height = this.searchHeightFromContent(contentHeight)
    this.lastSearchHeight = height
    this.applySearchBounds(win, height, { keepPosition: true })
    if (this.deferShowUntilSearchMeasured) {
      this.deferShowUntilSearchMeasured = false
      win.show()
      win.focus()
    }
  }

  showSearch(input: ShowSearchPayload = {}) {
    const { clipboard = '', q = '', source = 'hotkey' } = input
    const win = this.ensureShell()
    this.applySearchChrome()

    const target = this.searchUrl(q)
    const current = win.webContents.getURL()
    const onSearchPage = current.includes('/desktop/search')

    const reveal = () => {
      this.applySearchChrome()
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
    return (
      path.startsWith('/tools/') ||
      path === '/desktop/hub' ||
      path === '/desktop/settings'
    )
  }

  revealPanel() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    const path = this.pathnameFromUrl(win.webContents.getURL())
    if (this.isPanelRoute(win.webContents.getURL())) {
      this.setPanelMode(path)
    }
    win.show()
    win.focus()
  }

  /**
   * 全局快捷键：显隐切换。
   * - 窗口可见：隐藏
   * - 隐藏后唤起：若上次在工具/工具集，仅恢复该页；否则打开搜索并带入剪贴板
   */
  toggleSearch(clipboard = '') {
    const payload: ShowSearchPayload = { clipboard, source: 'hotkey' }
    const win = this.shell
    if (!win || win.isDestroyed()) {
      this.showSearch(payload)
      return
    }

    if (win.isVisible()) {
      this.hide()
      return
    }

    const url = win.webContents.getURL()
    if (this.loaded && this.isPanelRoute(url)) {
      this.revealPanel()
      return
    }

    this.showSearch(payload)
  }

  panelSizeForPath(_path: string) {
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
