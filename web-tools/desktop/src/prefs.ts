import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export type ClipboardPolicy = 'smart' | 'always' | 'never'

export type DesktopPrefs = {
  clipboardPolicy?: ClipboardPolicy
  lastAppliedClipboardHash?: string
  dismissedClipboardHash?: string
}

const DEFAULT_PREFS: DesktopPrefs = {
  clipboardPolicy: 'smart'
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
