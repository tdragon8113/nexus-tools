import type { StoredTotpAccount } from '~~/utils/totp'

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
