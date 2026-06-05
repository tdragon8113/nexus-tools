import { globalShortcut, Notification } from 'electron'
import { generateTotp, storedToTotpConfig } from '../../utils/totp'
import type { DesktopPrefsStore } from './prefs'
import type { TotpAccountStore } from './totpAccountStore'
import { autofillTotpCode, FOCUS_HANDOFF_MS } from './totpAutofill'

export type TotpShortcutPatchResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'register_failed' | 'shortcut_in_use' | 'reserved' | 'account_not_found' }

const RESERVED = new Set(['Alt+Space'])

/** 同一快捷键再次触发的最短间隔（防按住连发、修饰键未松开时的重入） */
const TRIGGER_COOLDOWN_MS = 1200

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function notifyTotpShortcutIssue(body: string) {
  if (!Notification.isSupported()) return
  new Notification({ title: 'Nexus Tools · 2FA 快捷键', body }).show()
}

function normalizeAccelerator(raw: string): string | null {
  const parts = raw
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return null
  return parts.join('+')
}

export class TotpShortcutManager {
  private acceleratorToAccount = new Map<string, string>()
  private autofillInFlight = false
  private lastTriggerAt = 0
  private captureSuspended = false

  constructor(
    private readonly deps: {
      prefs: DesktopPrefsStore
      accountStore: TotpAccountStore
      hideWindow: () => void
      mainSearchHotkey: string
    }
  ) {}

  private reservedAccelerators(): Set<string> {
    const set = new Set(RESERVED)
    const hotkey = normalizeAccelerator(this.deps.mainSearchHotkey)
    if (hotkey) set.add(hotkey)
    return set
  }

  getShortcuts(): Record<string, string> {
    return { ...(this.deps.prefs.read().totpShortcuts ?? {}) }
  }

  unregisterAllTotpShortcuts() {
    for (const accelerator of [...this.acceleratorToAccount.keys()]) {
      globalShortcut.unregister(accelerator)
    }
    this.acceleratorToAccount.clear()
  }

  private unregisterAccelerator(raw: string) {
    const normalized = normalizeAccelerator(raw)
    if (!normalized) return
    globalShortcut.unregister(normalized)
    this.acceleratorToAccount.delete(normalized)
  }

  setCaptureActive(active: boolean) {
    if (active) {
      if (this.captureSuspended) return
      this.captureSuspended = true
      this.unregisterAllTotpShortcuts()
      return
    }
    if (!this.captureSuspended) return
    this.captureSuspended = false
    this.reload()
  }

  pruneOrphanShortcuts(validAccountIds: ReadonlySet<string>) {
    const shortcuts = this.getShortcuts()
    let changed = false
    for (const accountId of Object.keys(shortcuts)) {
      if (validAccountIds.has(accountId)) continue
      const accelerator = shortcuts[accountId]
      if (accelerator) {
        this.unregisterAccelerator(accelerator)
      }
      delete shortcuts[accountId]
      changed = true
    }
    if (changed) {
      this.deps.prefs.write({ totpShortcuts: shortcuts })
    }
  }

  reload() {
    if (this.captureSuspended) return
    this.unregisterAllTotpShortcuts()
    const shortcuts = this.getShortcuts()
    for (const [accountId, accelerator] of Object.entries(shortcuts)) {
      if (!accelerator) continue
      if (!this.deps.accountStore.getById(accountId)) {
        console.warn('[Nexus Tools] 跳过无效 TOTP 快捷键绑定', accountId, accelerator)
        continue
      }
      const normalized = normalizeAccelerator(accelerator)
      if (!normalized || this.acceleratorToAccount.has(normalized)) continue
      const result = this.registerInternal(accountId, normalized, { persist: false })
      if (!result.ok) {
        console.warn('[Nexus Tools] TOTP 快捷键注册失败', normalized, result.error)
      }
    }
  }

  removeShortcutForAccount(accountId: string) {
    return this.setShortcut(accountId, null)
  }

  setShortcut(accountId: string, accelerator: string | null): TotpShortcutPatchResult {
    const shortcuts = this.getShortcuts()
    const previous = shortcuts[accountId]
    if (previous) {
      this.unregisterAccelerator(previous)
    }

    if (!accelerator) {
      delete shortcuts[accountId]
      this.deps.prefs.write({ totpShortcuts: shortcuts })
      return { ok: true }
    }

    if (!this.deps.accountStore.getById(accountId)) {
      return { ok: false, error: 'account_not_found' }
    }

    const normalized = normalizeAccelerator(accelerator)
    if (!normalized) return { ok: false, error: 'invalid' }

    if (this.reservedAccelerators().has(normalized)) {
      return { ok: false, error: 'reserved' }
    }

    for (const [id, existing] of Object.entries(shortcuts)) {
      if (id !== accountId && existing === normalized) {
        return { ok: false, error: 'shortcut_in_use' }
      }
    }

    return this.registerInternal(accountId, normalized, { persist: true, shortcuts })
  }

  private registerInternal(
    accountId: string,
    accelerator: string,
    opts: { persist: boolean; shortcuts?: Record<string, string> }
  ): TotpShortcutPatchResult {
    if (this.acceleratorToAccount.has(accelerator)) {
      globalShortcut.unregister(accelerator)
      this.acceleratorToAccount.delete(accelerator)
    }

    const ok = globalShortcut.register(accelerator, () => {
      void this.onTrigger(accountId)
    })
    if (!ok) return { ok: false, error: 'register_failed' }

    this.acceleratorToAccount.set(accelerator, accountId)

    if (opts.persist) {
      const shortcuts = { ...(opts.shortcuts ?? this.getShortcuts()), [accountId]: accelerator }
      this.deps.prefs.write({ totpShortcuts: shortcuts })
    }

    return { ok: true }
  }

  private async onTrigger(accountId: string) {
    const now = Date.now()
    if (this.autofillInFlight || now - this.lastTriggerAt < TRIGGER_COOLDOWN_MS) {
      return
    }

    const account = this.deps.accountStore.getById(accountId)
    if (!account) {
      console.warn('[Nexus Tools] TOTP 快捷键绑定的账户不存在', accountId)
      notifyTotpShortcutIssue('绑定的账户不存在，请重新打开 2FA 页面同步账户后再试。')
      return
    }

    this.autofillInFlight = true
    this.lastTriggerAt = now

    try {
      const codePromise = generateTotp(storedToTotpConfig(account))
      this.deps.hideWindow()
      await sleep(FOCUS_HANDOFF_MS)
      const code = await codePromise
      await autofillTotpCode(code)
    } catch (err) {
      console.error('[Nexus Tools] 生成 TOTP 失败', err)
    } finally {
      this.autofillInFlight = false
    }
  }
}
