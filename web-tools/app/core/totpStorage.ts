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
