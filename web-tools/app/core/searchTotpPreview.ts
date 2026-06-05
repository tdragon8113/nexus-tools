import type { TotpPreviewRow } from '~/core/searchPreview'
import { getTotpAccountsState } from '~/core/totpAccountsState'
import {
  generateTotp,
  storedToTotpConfig,
  totpRemainingSeconds,
  type StoredTotpAccount
} from '~~/utils/totp'

/** 为搜索预览或 TOTP 工具页生成带验证码的账户行 */
export async function buildTotpPreviewRows(
  accounts: StoredTotpAccount[] = getTotpAccountsState()
): Promise<TotpPreviewRow[]> {
  if (accounts.length === 0) return []

  return Promise.all(
    accounts.map(async (account) => ({
      account,
      code: await generateTotp(storedToTotpConfig(account)).catch(() => ''),
      remaining: totpRemainingSeconds(account.period)
    }))
  )
}
