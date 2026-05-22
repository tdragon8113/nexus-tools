import { BrowserWindow, screen } from 'electron'
import {
  HUB_HEIGHT,
  HUB_WIDTH,
  LAUNCHER_MIN_HEIGHT,
  LAUNCHER_WIDTH,
  TOOL_FLOAT_HEIGHT,
  TOOL_FLOAT_MIN_HEIGHT,
  TOOL_FLOAT_MIN_WIDTH,
  TOOL_FLOAT_SIZE,
  TOOL_FLOAT_WIDTH
} from './types'
import { getAppIcon } from './appIcon'

type PreloadFn = (file: string) => string

const DESKTOP_Q = 'desktop=1'

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

    // 开发时不失焦隐藏，便于调试；生产保持 uTools 失焦关闭
    this.shell.on('blur', () => {
      if (process.env.NEXUS_WEB_DEV === '1') return
      const url = this.shell?.webContents.getURL() ?? ''
      if (url.includes('/desktop/search')) this.hide()
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

  private searchUrl(clipboard = '', q = '') {
    const url = new URL('/desktop/search', this.webBaseUrl)
    url.searchParams.set('desktop', '1')
    if (clipboard) url.searchParams.set('clipboard', clipboard)
    if (q) url.searchParams.set('q', q)
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
    win.setMinimumSize(TOOL_FLOAT_MIN_WIDTH, TOOL_FLOAT_MIN_HEIGHT)
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

    const target = this.searchUrl(clipboard, q)
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

  toggleSearch(clipboard = '') {
    if (this.shell && !this.shell.isDestroyed() && this.shell.isVisible()) {
      const url = this.shell.webContents.getURL()
      if (url.includes('/desktop/search')) {
        this.hide()
        return
      }
    }
    this.showSearch(clipboard)
  }

  panelSizeForPath(path: string) {
    if (path === '/desktop/hub') return { width: HUB_WIDTH, height: HUB_HEIGHT }
    const id = path.replace(/^\/tools\//, '').split('/')[0] ?? ''
    return TOOL_FLOAT_SIZE[id] ?? { width: TOOL_FLOAT_WIDTH, height: TOOL_FLOAT_HEIGHT }
  }

  setPanelMode(path: string) {
    const size = this.panelSizeForPath(path)
    this.applyPanelChrome(size.width, size.height)
  }

  closeFromRenderer() {
    this.hide()
  }
}
