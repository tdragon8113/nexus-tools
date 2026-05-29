import { applyOpenAtLogin, getOpenAtLoginFromSystem } from './loginItem'
import type { AppUpdaterService } from './updater'
import type { ClipboardPolicy, DesktopPrefs, DesktopPrefsStore } from './prefs'

export type PrefsPatchDeps = {
  appUpdater?: AppUpdaterService | null
}

export function applyPrefsPatch(
  store: DesktopPrefsStore,
  raw: Partial<DesktopPrefs> | Record<string, unknown>,
  deps?: PrefsPatchDeps
): DesktopPrefs {
  const patch = raw as Record<string, unknown>
  const next: Partial<DesktopPrefs> = {}

  if (patch.clipboardPolicy === 'smart' || patch.clipboardPolicy === 'always' || patch.clipboardPolicy === 'never') {
    next.clipboardPolicy = patch.clipboardPolicy
  }
  if (typeof patch.lastAppliedClipboardHash === 'string') {
    next.lastAppliedClipboardHash = patch.lastAppliedClipboardHash
  }
  if (typeof patch.dismissedClipboardHash === 'string') {
    next.dismissedClipboardHash = patch.dismissedClipboardHash
  }
  if (typeof patch.autoHideOnBlur === 'boolean') {
    next.autoHideOnBlur = patch.autoHideOnBlur
  }
  if (typeof patch.autoUpdateEnabled === 'boolean') {
    next.autoUpdateEnabled = patch.autoUpdateEnabled
    deps?.appUpdater?.setAutoUpdateEnabled(patch.autoUpdateEnabled)
  }
  if (typeof patch.openAtLogin === 'boolean') {
    next.openAtLogin = patch.openAtLogin
    applyOpenAtLogin(patch.openAtLogin)
  }

  const saved = store.write(next)
  return { ...saved, openAtLogin: getOpenAtLoginFromSystem() }
}
