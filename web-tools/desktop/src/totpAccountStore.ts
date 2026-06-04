import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { StoredTotpAccount } from '../../utils/totp'

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

export class TotpAccountStore {
  private accounts: StoredTotpAccount[] = []

  private filePath(): string {
    return path.join(app.getPath('userData'), 'totp-accounts.json')
  }

  loadFromDisk(): StoredTotpAccount[] {
    try {
      const raw = fs.readFileSync(this.filePath(), 'utf8')
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        this.accounts = []
        return this.accounts
      }
      this.accounts = parsed.filter(isStoredTotpAccount)
    } catch {
      this.accounts = []
    }
    return this.accounts
  }

  saveAccounts(accounts: StoredTotpAccount[]): StoredTotpAccount[] {
    this.accounts = accounts.filter(isStoredTotpAccount)
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      fs.writeFileSync(this.filePath(), JSON.stringify(this.accounts))
    } catch (err) {
      console.warn('[Nexus Tools] 无法保存 TOTP 账户', err)
    }
    return this.accounts
  }

  list(): StoredTotpAccount[] {
    return [...this.accounts]
  }

  getById(id: string): StoredTotpAccount | undefined {
    return this.accounts.find((row) => row.id === id)
  }
}
