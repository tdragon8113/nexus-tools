import { isElectronShell } from '~/core/desktop'
import { isStoredTotpAccount } from '~/core/totpStorage'
import { LEGACY_TOTP_STORAGE_KEY } from '~~/shared/rendererLocalState'
import type { StoredTotpAccount } from '~~/utils/totp'

const TOTP_ACCOUNTS_STATE_KEY = 'totp-accounts-global'
const TOTP_HYDRATED_STATE_KEY = 'totp-accounts-hydrated'

function readLegacyTotpAccounts(): StoredTotpAccount[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(LEGACY_TOTP_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredTotpAccount)
  } catch {
    return []
  }
}

function clearLegacyTotpAccounts() {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(LEGACY_TOTP_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getTotpAccountsState(): StoredTotpAccount[] {
  return useState<StoredTotpAccount[]>(TOTP_ACCOUNTS_STATE_KEY, () => []).value
}

/** 启动时从 totp-accounts.json 加载；旧 localStorage 仅一次性迁移 */
export async function hydrateTotpAccountsFromMain(): Promise<StoredTotpAccount[]> {
  if (!import.meta.client) return []

  const accounts = useState<StoredTotpAccount[]>(TOTP_ACCOUNTS_STATE_KEY, () => [])
  const hydrated = useState(TOTP_HYDRATED_STATE_KEY, () => false)
  if (hydrated.value) return accounts.value

  if (!isElectronShell() || !window.nexusDesktop?.getTotpAccounts) {
    accounts.value = readLegacyTotpAccounts()
    hydrated.value = true
    return accounts.value
  }

  try {
    let fromMain = await window.nexusDesktop.getTotpAccounts()
    const legacy = readLegacyTotpAccounts()

    if (fromMain.length === 0 && legacy.length > 0 && window.nexusDesktop.syncTotpAccounts) {
      fromMain = await window.nexusDesktop.syncTotpAccounts(legacy)
      clearLegacyTotpAccounts()
    } else if (legacy.length > 0 && window.nexusDesktop.syncTotpAccounts) {
      const mainIds = new Set(fromMain.map((row) => row.id))
      const localOnly = legacy.filter((row) => !mainIds.has(row.id))
      if (localOnly.length > 0) {
        fromMain = await window.nexusDesktop.syncTotpAccounts([...fromMain, ...localOnly])
        clearLegacyTotpAccounts()
      }
    }

    accounts.value = fromMain
  } catch (err) {
    console.error('[Nexus Tools] 读取 TOTP 账户失败', err)
    accounts.value = readLegacyTotpAccounts()
  }

  hydrated.value = true
  return accounts.value
}

export async function persistTotpAccountsState(accounts: StoredTotpAccount[]): Promise<StoredTotpAccount[]> {
  if (!import.meta.client) return accounts

  const state = useState<StoredTotpAccount[]>(TOTP_ACCOUNTS_STATE_KEY, () => [])
  state.value = accounts

  if (!isElectronShell() || !window.nexusDesktop?.syncTotpAccounts) {
    try {
      localStorage.setItem(LEGACY_TOTP_STORAGE_KEY, JSON.stringify(accounts))
    } catch {
      /* ignore */
    }
    return accounts
  }

  try {
    const synced = await window.nexusDesktop.syncTotpAccounts(accounts)
    state.value = synced
    clearLegacyTotpAccounts()
    return synced
  } catch (err) {
    console.error('[Nexus Tools] 保存 TOTP 账户失败', err)
    return accounts
  }
}
