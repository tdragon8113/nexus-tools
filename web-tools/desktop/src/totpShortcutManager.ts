import { globalShortcut } from 'electron'
import { generateTotp, storedToTotpConfig } from '../../utils/totp'
import type { DesktopPrefsStore } from './prefs'
import type { TotpAccountStore } from './totpAccountStore'
import { autofillTotpCode, FOCUS_HANDOFF_MS } from './totpAutofill'

export type TotpShortcutPatchResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'register_failed' | 'shortcut_in_use' | 'reserved' }

const RESERVED = new Set(['Alt+Space'])

/** 同一快捷键再次触发的最短间隔（防按住连发、修饰键未松开时的重入） */
const TRIGGER_COOLDOWN_MS = 1200

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
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
    for (const accelerator of this.acceleratorToAccount.keys()) {
      globalShortcut.unregister(accelerator)
    }
    this.acceleratorToAccount.clear()
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

  reload() {
    if (this.captureSuspended) return
    this.unregisterAllTotpShortcuts()
    const shortcuts = this.getShortcuts()
    for (const [accountId, accelerator] of Object.entries(shortcuts)) {
      if (!accelerator) continue
      const normalized = normalizeAccelerator(accelerator)
      if (!normalized || this.acceleratorToAccount.has(normalized)) continue
      this.registerInternal(accountId, normalized, { persist: false })
    }
  }

  removeShortcutForAccount(accountId: string) {
    return this.setShortcut(accountId, null)
  }

  setShortcut(accountId: string, accelerator: string | null): TotpShortcutPatchResult {
    const shortcuts = this.getShortcuts()
    const previous = shortcuts[accountId]
    if (previous) {
      globalShortcut.unregister(previous)
      this.acceleratorToAccount.delete(previous)
    }

    if (!accelerator) {
      delete shortcuts[accountId]
      this.deps.prefs.write({ totpShortcuts: shortcuts })
      return { ok: true }
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
    if (!account) return

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
