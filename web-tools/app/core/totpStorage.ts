import type { StoredTotpAccount } from '~~/utils/totp'

export const TOTP_STORAGE_KEY = 'nexus-totp-accounts-v1'

export function isStoredTotpAccount(value: unknown): value is StoredTotpAccount {
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

export function persistStoredTotpAccounts(accounts: StoredTotpAccount[]) {
  if (!import.meta.client) return
  localStorage.setItem(TOTP_STORAGE_KEY, JSON.stringify(accounts))
}

/** 启动时以主进程 userData 为准，并合并 localStorage 中尚未同步的账户 */
export async function hydrateTotpStorageFromMain(): Promise<StoredTotpAccount[]> {
  if (!import.meta.client) return []

  const fromLocal = loadStoredTotpAccounts()

  if (!window.nexusDesktop?.getTotpAccounts) {
    return fromLocal
  }

  try {
    const fromMain = await window.nexusDesktop.getTotpAccounts()

    if (fromMain.length === 0 && fromLocal.length > 0 && window.nexusDesktop.syncTotpAccounts) {
      const synced = await window.nexusDesktop.syncTotpAccounts(fromLocal)
      persistStoredTotpAccounts(synced)
      return synced
    }

    const mainIds = new Set(fromMain.map((row) => row.id))
    const localOnly = fromLocal.filter((row) => !mainIds.has(row.id))
    if (localOnly.length > 0 && window.nexusDesktop.syncTotpAccounts) {
      const merged = [...fromMain, ...localOnly]
      const synced = await window.nexusDesktop.syncTotpAccounts(merged)
      persistStoredTotpAccounts(synced)
      return synced
    }

    if (fromMain.length > 0) {
      persistStoredTotpAccounts(fromMain)
      return fromMain
    }

    return fromLocal
  } catch (err) {
    console.error('[Nexus Tools] 读取 TOTP 账户失败', err)
    return fromLocal
  }
}

export function loadStoredTotpAccounts(): StoredTotpAccount[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(TOTP_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredTotpAccount)
  } catch {
    return []
  }
}
