import { applyOpenAtLogin, getOpenAtLoginFromSystem } from './loginItem'
import type { AppUpdaterService } from './updater'
import type { ClipboardPolicy, DesktopPrefs, DesktopPrefsStore, DesktopThemePreference } from './prefs'

function isThemePreference(value: unknown): value is DesktopThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

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
  if (isThemePreference(patch.theme)) {
    next.theme = patch.theme
  }
  if (patch.totpShortcuts && typeof patch.totpShortcuts === 'object') {
    const cleaned: Record<string, string> = {}
    for (const [id, accelerator] of Object.entries(patch.totpShortcuts)) {
      if (typeof id === 'string' && typeof accelerator === 'string' && accelerator.trim()) {
        cleaned[id] = accelerator.trim()
      }
    }
    next.totpShortcuts = cleaned
  }

  const saved = store.write(next)
  return { ...saved, openAtLogin: getOpenAtLoginFromSystem() }
}
