import type { TotpPreviewRow } from '~/core/searchPreview'
import { buildTotpPreviewRows } from '~/core/searchTotpPreview'
import {
  getTotpAccountsState,
  hydrateTotpAccountsFromMain,
  persistTotpAccountsState
} from '~/core/totpAccountsState'
import {
  totpConfigToStored,
  totpSecretFingerprint,
  type StoredTotpAccount,
  type TotpConfig
} from '~~/utils/totp'

export type TotpAccountLive = TotpPreviewRow

export function useTotpAccounts() {
  const accounts = useState<StoredTotpAccount[]>('totp-accounts-global', () => [])
  const liveRows = ref<TotpAccountLive[]>([])

  let tickTimer: ReturnType<typeof setInterval> | null = null

  function stopTicker() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  async function refreshLiveRows() {
    liveRows.value = await buildTotpPreviewRows(accounts.value)
  }

  function startTicker() {
    stopTicker()
    if (!import.meta.client) return
    void refreshLiveRows()
    tickTimer = setInterval(() => {
      void refreshLiveRows()
    }, 1000)
  }

  async function syncAccounts(next: StoredTotpAccount[]) {
    accounts.value = await persistTotpAccountsState(next)
    void refreshLiveRows()
  }

  async function loadAccounts() {
    const rows = await hydrateTotpAccountsFromMain()
    accounts.value = rows.length ? rows : getTotpAccountsState()
    startTicker()
  }

  function hasDuplicate(config: TotpConfig, exceptId?: string): boolean {
    const fingerprint = totpSecretFingerprint(config)
    return accounts.value.some(
      (item) => item.id !== exceptId && item.secretBase32 === fingerprint
    )
  }

  function addAccount(config: TotpConfig): boolean {
    if (hasDuplicate(config)) return false
    void syncAccounts([...accounts.value, totpConfigToStored(config)])
    return true
  }

  function updateAccount(id: string, config: TotpConfig): boolean {
    if (hasDuplicate(config, id)) return false
    const index = accounts.value.findIndex((item) => item.id === id)
    if (index === -1) return false
    const next = [...accounts.value]
    next[index] = totpConfigToStored(config, id)
    void syncAccounts(next)
    return true
  }

  function removeAccount(id: string) {
    void syncAccounts(accounts.value.filter((item) => item.id !== id))
    if (import.meta.client && window.nexusDesktop?.setTotpShortcut) {
      void window.nexusDesktop.setTotpShortcut(id, null)
    }
  }

  function setAccountOrder(ids: string[]) {
    const known = new Set(accounts.value.map((item) => item.id))
    const map = new Map(accounts.value.map((item) => [item.id, item]))
    const ordered = ids.filter((id) => known.has(id)).map((id) => map.get(id)!)
    const missing = accounts.value.filter((item) => !ids.includes(item.id))
    void syncAccounts([...ordered, ...missing])
  }

  function getAccount(id: string): StoredTotpAccount | undefined {
    return accounts.value.find((item) => item.id === id)
  }

  onBeforeUnmount(() => {
    stopTicker()
  })

  return {
    accounts,
    liveRows,
    loadAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    setAccountOrder,
    hasDuplicate,
    getAccount
  }
}
