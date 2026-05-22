import { BrowserWindow, screen } from 'electron'
import {
  LAUNCHER_MIN_HEIGHT,
  LAUNCHER_WIDTH,
  PANEL_HEIGHT,
  PANEL_MIN_HEIGHT,
  PANEL_MIN_WIDTH,
  PANEL_WIDTH
} from './types'
import { getAppIcon } from './appIcon'

type PreloadFn = (file: string) => string

/** URL 中 q 参数上限；剪贴板一律走 IPC，避免 base64 图片等撑爆 URL */
const MAX_URL_Q_LEN = 512

/** 单窗 SPA：主进程只管显隐、尺寸；路由由 Nuxt 负责 */
export class WindowManager {
  private shell: BrowserWindow | null = null
  private loaded = false

  constructor(
    private readonly webBaseUrl: string,
    private readonly preloadPath: PreloadFn
  ) {}

  private workArea() {
    return screen.getPrimaryDisplay().workAreaSize
  }

  private ensureShell(): BrowserWindow {
    if (this.shell && !this.shell.isDestroyed()) return this.shell

    const { width: workW, height: workH } = this.workArea()
    const icon = getAppIcon()

    this.shell = new BrowserWindow({
      width: LAUNCHER_WIDTH,
      height: LAUNCHER_MIN_HEIGHT,
      x: Math.round((workW - LAUNCHER_WIDTH) / 2),
      y: Math.round(workH * 0.18),
      frame: false,
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

    // 点击窗口外失焦时隐藏（uTools 式）；短延迟避免误触（如短暂失焦又收回焦点）
    this.shell.on('blur', () => {
      if (process.env.NEXUS_KEEP_VISIBLE === '1') return
      const win = this.shell
      if (!win || win.isDestroyed()) return
      setTimeout(() => {
        if (win.isDestroyed() || !win.isVisible()) return
        const focused = BrowserWindow.getFocusedWindow()
        if (focused === win) return
        this.hide()
      }, 120)
    })

    this.shell.on('closed', () => {
      this.shell = null
      this.loaded = false
    })

    this.shell.webContents.on('did-finish-load', () => {
      this.loaded = true
    })

    this.shell.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[Nexus Tools] 页面加载失败 (${code}): ${desc}\n  ${url}`)
      console.error('[Nexus Tools] 开发模式请先 cd web-tools && npm run dev，再运行 desktop:dev')
    })

    return this.shell
  }

  private searchUrl(q = '') {
    const url = new URL('/desktop/search', this.webBaseUrl)
    url.searchParams.set('desktop', '1')
    const safeQ = q.trim()
    if (safeQ && safeQ.length <= MAX_URL_Q_LEN) {
      url.searchParams.set('q', safeQ)
    }
    return url.toString()
  }

  applySearchChrome() {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    win.setMinimumSize(360, LAUNCHER_MIN_HEIGHT)
    win.setResizable(false)
    const { width: workW } = this.workArea()
    const [x, y] = win.getPosition()
    win.setSize(LAUNCHER_WIDTH, win.getSize()[1], false)
    win.setPosition(Math.round((workW - LAUNCHER_WIDTH) / 2), y)
  }

  applyPanelChrome(width: number, height: number) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    const { width: workW, height: workH } = this.workArea()
    const w = Math.min(width, workW - 40)
    const h = Math.min(height, workH - 40)
    win.setMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT)
    win.setResizable(true)
    const [_, y] = win.getPosition()
    win.setSize(w, h, false)
    const nx = Math.round((workW - w) / 2)
    const ny = y < workH * 0.5 ? y : Math.round(workH * 0.1)
    win.setPosition(nx, ny)
  }

  resizeSearch(contentHeight: number) {
    const win = this.shell
    if (!win || win.isDestroyed()) return
    const { height: workH } = this.workArea()
    const maxH = Math.round(workH * 0.65)
    const h = Math.min(maxH, Math.max(LAUNCHER_MIN_HEIGHT, Math.round(contentHeight)))
    const [x, y] = win.getPosition()
    win.setSize(LAUNCHER_WIDTH, h, false)
    win.setPosition(x, y)
  }

  showSearch(clipboard = '', q = '') {
    const win = this.ensureShell()
    this.applySearchChrome()

    const target = this.searchUrl(q)
    const current = win.webContents.getURL()
    const onSearchPage = current.includes('/desktop/search')

    const reveal = () => {
      win.show()
      win.focus()
      win.webContents.send('desktop:show-search', { clipboard, q })
    }

    if (!this.loaded || !onSearchPage) {
      win.loadURL(target)
      win.webContents.once('did-finish-load', reveal)
    } else {
      reveal()
    }
  }

  hide() {
    if (this.shell && !this.shell.isDestroyed()) this.shell.hide()
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
    return path.startsWith('/tools/') || path === '/desktop/hub'
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
   * 已在工具/工具集时保持当前页；仅搜索入口或未打开过工具时再进搜索。
   */
  toggleSearch(clipboard = '') {
    const win = this.shell
    if (!win || win.isDestroyed()) {
      this.showSearch(clipboard)
      return
    }

    if (win.isVisible()) {
      this.hide()
      return
    }

    const current = win.webContents.getURL()
    if (this.loaded && this.isPanelRoute(current)) {
      this.revealPanel()
      return
    }

    this.showSearch(clipboard)
  }

  panelSizeForPath(_path: string) {
    return { width: PANEL_WIDTH, height: PANEL_HEIGHT }
  }

  setPanelMode(path: string) {
    const size = this.panelSizeForPath(path)
    this.applyPanelChrome(size.width, size.height)
  }

  closeFromRenderer() {
    this.hide()
  }
}
