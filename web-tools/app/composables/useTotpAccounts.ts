import {
  generateTotp,
  storedToTotpConfig,
  totpConfigToStored,
  totpRemainingSeconds,
  totpSecretFingerprint,
  type StoredTotpAccount,
  type TotpConfig
} from '~~/utils/totp'

const STORAGE_KEY = 'nexus-totp-accounts-v1'

export interface TotpAccountLive {
  account: StoredTotpAccount
  code: string
  remaining: number
}

function loadStoredAccounts(): StoredTotpAccount[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredTotpAccount)
  } catch {
    return []
  }
}

function isStoredTotpAccount(value: unknown): value is StoredTotpAccount {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string'
    && typeof row.label === 'string'
    && typeof row.secretBase32 === 'string'
    && typeof row.digits === 'number'
    && typeof row.period === 'number'
    && (row.algorithm === 'SHA1' || row.algorithm === 'SHA256' || row.algorithm === 'SHA512')
  )
}

function persistAccounts(accounts: StoredTotpAccount[]) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export function useTotpAccounts() {
  const accounts = ref<StoredTotpAccount[]>([])
  const liveRows = ref<TotpAccountLive[]>([])

  let tickTimer: ReturnType<typeof setInterval> | null = null

  function stopTicker() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  async function refreshLiveRows() {
    if (accounts.value.length === 0) {
      liveRows.value = []
      return
    }

    const rows = await Promise.all(
      accounts.value.map(async (account) => {
        const config = storedToTotpConfig(account)
        const code = await generateTotp(config).catch(() => '')
        return {
          account,
          code,
          remaining: totpRemainingSeconds(account.period)
        } satisfies TotpAccountLive
      })
    )
    liveRows.value = rows
  }

  function startTicker() {
    stopTicker()
    if (!import.meta.client) return
    void refreshLiveRows()
    tickTimer = setInterval(() => {
      void refreshLiveRows()
    }, 1000)
  }

  function syncAccounts(next: StoredTotpAccount[]) {
    accounts.value = next
    persistAccounts(next)
    void refreshLiveRows()
  }

  function loadAccounts() {
    accounts.value = loadStoredAccounts()
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
    syncAccounts([...accounts.value, totpConfigToStored(config)])
    return true
  }

  function updateAccount(id: string, config: TotpConfig): boolean {
    if (hasDuplicate(config, id)) return false
    const index = accounts.value.findIndex((item) => item.id === id)
    if (index === -1) return false
    const next = [...accounts.value]
    next[index] = totpConfigToStored(config, id)
    syncAccounts(next)
    return true
  }

  function removeAccount(id: string) {
    syncAccounts(accounts.value.filter((item) => item.id !== id))
  }

  function setAccountOrder(ids: string[]) {
    const known = new Set(accounts.value.map((item) => item.id))
    const map = new Map(accounts.value.map((item) => [item.id, item]))
    const ordered = ids.filter((id) => known.has(id)).map((id) => map.get(id)!)
    const missing = accounts.value.filter((item) => !ids.includes(item.id))
    syncAccounts([...ordered, ...missing])
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
