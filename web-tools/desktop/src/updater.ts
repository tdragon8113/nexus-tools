import { app, BrowserWindow, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

const GITHUB_OWNER = 'tdragon8113'
const GITHUB_REPO = 'nexus-tools'
const RELEASE_TAG_PREFIX = 'web-tools-v'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type UpdateState = {
  status: UpdateStatus
  currentVersion: string
  latestVersion?: string
  releaseTag?: string
  releaseUrl?: string
  percent?: number
  error?: string
  /** macOS 未签名包可能无法静默安装，需打开 Release 手动下载 */
  manualInstallRecommended?: boolean
}

type GitHubRelease = {
  tag_name: string
  html_url: string
  draft: boolean
  prerelease: boolean
}

function parseReleaseVersion(tagName: string): string | null {
  if (!tagName.startsWith(RELEASE_TAG_PREFIX)) return null
  const version = tagName.slice(RELEASE_TAG_PREFIX.length)
  return /^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(version) ? version : null
}

function isVersionNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map((part) => parseInt(part, 10) || 0)
  const a = parse(latest)
  const b = parse(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

function broadcastState(getWindows: () => BrowserWindow[], state: UpdateState) {
  for (const win of getWindows()) {
    if (win.isDestroyed()) continue
    win.webContents.send('desktop:update-state', state)
  }
}

export class AppUpdaterService {
  private state: UpdateState = {
    status: 'idle',
    currentVersion: app.getVersion()
  }

  private autoUpdateEnabled = true
  private releaseTag: string | null = null
  private releaseUrl: string | null = null
  private initialized = false

  constructor(private readonly getWindows: () => BrowserWindow[]) {}

  getState(): UpdateState {
    return { ...this.state }
  }

  setAutoUpdateEnabled(enabled: boolean) {
    this.autoUpdateEnabled = enabled
    autoUpdater.autoDownload = enabled
    autoUpdater.autoInstallOnAppQuit = enabled
  }

  init() {
    if (!app.isPackaged || this.initialized) return
    this.initialized = true

    autoUpdater.autoDownload = this.autoUpdateEnabled
    autoUpdater.autoInstallOnAppQuit = this.autoUpdateEnabled
    autoUpdater.allowDowngrade = false

    autoUpdater.on('checking-for-update', () => {
      this.patchState({ status: 'checking', error: undefined })
    })
    autoUpdater.on('update-available', (info) => {
      this.patchState({
        status: 'available',
        latestVersion: info.version,
        error: undefined
      })
    })
    autoUpdater.on('update-not-available', () => {
      this.patchState({ status: 'not-available', error: undefined })
    })
    autoUpdater.on('download-progress', (progress) => {
      this.patchState({
        status: 'downloading',
        percent: progress.percent
      })
    })
    autoUpdater.on('update-downloaded', () => {
      this.patchState({ status: 'downloaded', percent: 100, error: undefined })
      if (this.autoUpdateEnabled && process.platform === 'win32') {
        setTimeout(() => this.install(), 800)
      }
    })
    autoUpdater.on('error', (err) => {
      const manual = process.platform === 'darwin'
      this.patchState({
        status: 'error',
        error: err.message,
        manualInstallRecommended: manual
      })
    })

    if (this.autoUpdateEnabled) {
      setTimeout(() => void this.check(), 4000)
    }
  }

  private patchState(patch: Partial<UpdateState>) {
    this.state = { ...this.state, ...patch }
    broadcastState(this.getWindows, this.state)
  }

  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'NexusTools-Desktop-Updater'
      }
    })
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status}`)
    }
    return (await res.json()) as GitHubRelease
  }

  async check(): Promise<UpdateState> {
    if (!app.isPackaged) {
      this.patchState({
        status: 'not-available',
        error: '开发模式不支持检查更新'
      })
      return this.getState()
    }

    this.patchState({
      status: 'checking',
      currentVersion: app.getVersion(),
      error: undefined,
      percent: undefined
    })

    try {
      const release = await this.fetchLatestRelease()
      if (!release || release.draft || release.prerelease) {
        this.patchState({ status: 'not-available' })
        return this.getState()
      }

      const latestVersion = parseReleaseVersion(release.tag_name)
      if (!latestVersion) {
        throw new Error('无法解析最新版本号')
      }

      this.releaseTag = release.tag_name
      this.releaseUrl = release.html_url

      const current = app.getVersion()
      if (!isVersionNewer(latestVersion, current)) {
        this.patchState({
          status: 'not-available',
          latestVersion,
          releaseTag: release.tag_name,
          releaseUrl: release.html_url
        })
        return this.getState()
      }

      this.patchState({
        status: 'available',
        latestVersion,
        releaseTag: release.tag_name,
        releaseUrl: release.html_url,
        manualInstallRecommended: process.platform === 'darwin'
      })

      if (this.autoUpdateEnabled) {
        void this.download()
      }

      return this.getState()
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查更新失败'
      this.patchState({ status: 'error', error: message })
      return this.getState()
    }
  }

  async download(): Promise<UpdateState> {
    if (!app.isPackaged) return this.getState()
    if (!this.releaseTag) {
      await this.check()
      if (this.state.status !== 'available' || !this.releaseTag) return this.getState()
    }

    const feedUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${this.releaseTag}/`
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })

    this.patchState({ status: 'downloading', percent: 0, error: undefined })

    try {
      const checkResult = await autoUpdater.checkForUpdates()
      if (!checkResult?.updateInfo) {
        this.patchState({ status: 'not-available' })
        return this.getState()
      }
      if (checkResult.downloadPromise) {
        await checkResult.downloadPromise
      } else {
        await autoUpdater.downloadUpdate()
      }
      return this.getState()
    } catch (err) {
      const message = err instanceof Error ? err.message : '下载更新失败'
      this.patchState({
        status: 'error',
        error: message,
        manualInstallRecommended: true
      })
      return this.getState()
    }
  }

  install() {
    if (!app.isPackaged) return
    if (process.platform === 'win32') {
      autoUpdater.quitAndInstall(false, true)
      return
    }
    void this.openReleasePage()
  }

  openReleasePage() {
    const url = this.releaseUrl ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    void shell.openExternal(url)
  }
}
