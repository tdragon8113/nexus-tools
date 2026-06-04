import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export type ClipboardPolicy = 'smart' | 'always' | 'never'

export type DesktopThemePreference = 'light' | 'dark' | 'system'

export type DesktopPrefs = {
  clipboardPolicy?: ClipboardPolicy
  lastAppliedClipboardHash?: string
  dismissedClipboardHash?: string
  /** 失焦或 Cmd+Tab 时隐藏窗口；关闭则仅被其他窗口覆盖。默认开启 */
  autoHideOnBlur?: boolean
  /** 自动检查、下载并安装更新（打包版） */
  autoUpdateEnabled?: boolean
  /** 登录系统后自动启动应用（默认关闭） */
  openAtLogin?: boolean
  /** 界面主题：亮色 / 暗色 / 跟随系统 */
  theme?: DesktopThemePreference
  /** 2FA 账户全局快捷键：accountId → Electron accelerator */
  totpShortcuts?: Record<string, string>
}

const DEFAULT_PREFS: DesktopPrefs = {
  clipboardPolicy: 'smart',
  autoHideOnBlur: true,
  autoUpdateEnabled: true,
  openAtLogin: false,
  theme: 'system'
}

export class DesktopPrefsStore {
  private prefsPath(): string {
    return path.join(app.getPath('userData'), 'desktop-prefs.json')
  }

  read(): DesktopPrefs {
    try {
      const raw = fs.readFileSync(this.prefsPath(), 'utf8')
      const parsed = JSON.parse(raw) as DesktopPrefs
      return { ...DEFAULT_PREFS, ...parsed }
    } catch {
      return { ...DEFAULT_PREFS }
    }
  }

  write(patch: Partial<DesktopPrefs>): DesktopPrefs {
    const next = { ...this.read(), ...patch }
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      fs.writeFileSync(this.prefsPath(), JSON.stringify(next))
    } catch (err) {
      console.warn('[Nexus Tools] 无法保存偏好', err)
    }
    return next
  }
}
