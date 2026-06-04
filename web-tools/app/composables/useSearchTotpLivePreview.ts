import {
  buildTotpAccountsSearchPreview,
  buildTotpConfigSearchPreview,
  resolveTotpPreviewAccountFilter,
  type SearchPreviewModel
} from '~/core/searchPreview'
import { buildTotpPreviewRows } from '~/core/searchTotpPreview'
import type { ContentHint } from '~/core/search'
import type { SearchResultItem } from '~/core/searchResults'
import { generateTotp, parseOtpAuthUrl, totpRemainingSeconds } from '~~/utils/totp'

const TOTP_TICK_MS = 1000

export function useSearchTotpLivePreview(deps: {
  selectedItem: ComputedRef<SearchResultItem | null>
  commandTrimmed: ComputedRef<string>
  queryTrimmed: ComputedRef<string>
  hint: ComputedRef<ContentHint | null | undefined>
  onUpdated: () => void
}) {
  const livePreview = ref<SearchPreviewModel | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function isTotpToolSelected(): boolean {
    const item = deps.selectedItem.value
    return item?.kind === 'tool' && item.tool?.id === 'totp'
  }

  function shouldUseLivePreview(): boolean {
    if (!isTotpToolSelected()) return false
    const q = deps.queryTrimmed.value
    if (!q) return true
    return q.toLowerCase().startsWith('otpauth://') || deps.hint.value?.kind === 'totp'
  }

  async function refresh() {
    if (!shouldUseLivePreview()) {
      livePreview.value = null
      return
    }

    const q = deps.queryTrimmed.value.trim()
    if (q.toLowerCase().startsWith('otpauth://')) {
      const config = parseOtpAuthUrl(q)
      if (config) {
        const code = await generateTotp(config).catch(() => '')
        livePreview.value = buildTotpConfigSearchPreview(
          config,
          code,
          totpRemainingSeconds(config.period)
        )
        deps.onUpdated()
        return
      }
    }

    const rows = await buildTotpPreviewRows()
    livePreview.value = buildTotpAccountsSearchPreview(
      rows,
      resolveTotpPreviewAccountFilter(deps.commandTrimmed.value)
    )
    deps.onUpdated()
  }

  function restartTicker() {
    stopTimer()
    if (!shouldUseLivePreview()) {
      livePreview.value = null
      return
    }
    void refresh()
    timer = setInterval(() => void refresh(), TOTP_TICK_MS)
  }

  onBeforeUnmount(stopTimer)

  return {
    livePreview,
    shouldUseLivePreview,
    restartTicker,
    stopTimer
  }
}
