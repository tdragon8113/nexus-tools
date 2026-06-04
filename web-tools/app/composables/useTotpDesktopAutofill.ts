import type { StoredTotpAccount } from '~~/utils/totp'

export type TotpAccessibilityStatus = {
  trusted: boolean
  required: boolean
  appName: string
  isDev: boolean
  hint: string
  authStatus?: string
  launchHost?: string | null
}

const defaultAccessibilityStatus = (): TotpAccessibilityStatus => ({
  trusted: true,
  required: false,
  appName: 'Nexus Tools',
  isDev: false,
  hint: '请在系统设置 → 辅助功能中开启本应用。'
})

export function useTotpDesktopAutofill() {
  const shortcuts = useState<Record<string, string>>('totp-desktop-shortcuts', () => ({}))
  const loaded = useState('totp-desktop-shortcuts-loaded', () => false)
  const supported = computed(
    () => import.meta.client && Boolean(window.nexusDesktop?.setTotpShortcut)
  )

  async function syncAccountsToMain(accounts: StoredTotpAccount[]) {
    if (!supported.value || !window.nexusDesktop?.syncTotpAccounts) return
    try {
      await window.nexusDesktop.syncTotpAccounts(accounts)
    } catch (err) {
      console.error('[Nexus Tools] 同步 TOTP 账户到主进程失败', err)
    }
  }

  async function refreshShortcuts() {
    if (!supported.value || !window.nexusDesktop?.getTotpShortcuts) {
      loaded.value = true
      return
    }
    try {
      shortcuts.value = (await window.nexusDesktop.getTotpShortcuts()) ?? {}
    } catch (err) {
      console.error('[Nexus Tools] 读取 TOTP 快捷键失败', err)
    } finally {
      loaded.value = true
    }
  }

  async function setShortcut(accountId: string, accelerator: string | null) {
    if (!window.nexusDesktop?.setTotpShortcut) {
      return { ok: false as const, error: 'unsupported' }
    }
    const result = await window.nexusDesktop.setTotpShortcut(accountId, accelerator)
    if (result.ok) {
      if (accelerator) shortcuts.value = { ...shortcuts.value, [accountId]: accelerator }
      else {
        const next = { ...shortcuts.value }
        delete next[accountId]
        shortcuts.value = next
      }
    }
    return result
  }

  async function clearShortcut(accountId: string) {
    return setShortcut(accountId, null)
  }

  function shortcutFor(accountId: string): string | undefined {
    return shortcuts.value[accountId]
  }

  async function getAccessibilityStatus(): Promise<TotpAccessibilityStatus> {
    if (!window.nexusDesktop?.getTotpAccessibilityStatus) {
      return defaultAccessibilityStatus()
    }
    try {
      return await window.nexusDesktop.getTotpAccessibilityStatus()
    } catch {
      return defaultAccessibilityStatus()
    }
  }

  async function requestAccessibilityPermission(): Promise<
    TotpAccessibilityStatus & { prompted: boolean; openedSettings: boolean }
  > {
    if (!window.nexusDesktop?.requestTotpAccessibilityPermission) {
      return { ...defaultAccessibilityStatus(), prompted: false, openedSettings: false }
    }
    try {
      return await window.nexusDesktop.requestTotpAccessibilityPermission()
    } catch {
      return { ...defaultAccessibilityStatus(), prompted: false, openedSettings: false }
    }
  }

  async function openAccessibilitySettingsOnly(): Promise<TotpAccessibilityStatus> {
    if (!window.nexusDesktop?.openTotpAccessibilitySettings) {
      return defaultAccessibilityStatus()
    }
    try {
      return await window.nexusDesktop.openTotpAccessibilitySettings()
    } catch {
      return defaultAccessibilityStatus()
    }
  }

  return {
    supported,
    loaded,
    shortcuts,
    syncAccountsToMain,
    refreshShortcuts,
    setShortcut,
    clearShortcut,
    shortcutFor,
    getAccessibilityStatus,
    requestAccessibilityPermission,
    openAccessibilitySettingsOnly
  }
}
