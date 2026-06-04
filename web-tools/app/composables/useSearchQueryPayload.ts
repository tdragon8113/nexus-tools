import {
  formatSearchPayloadDisplay,
  formatSearchPayloadSize,
  shouldHoldSearchPayload
} from '~/core/search'
import { useLastSearchTransferText } from '~/core/prefill'
import { useDesktopSearchInput } from '~/composables/useDesktopSearchInput'

/**
 * 搜索框：与剪贴板同上限（约 14M 字符）全文展示；超出才截断。
 */
export function useSearchQueryPayload(displayKey: string, payloadKey: string) {
  const display = useState<string>(displayKey, () => '')
  const payload = useState<string>(payloadKey, () => '')
  const fromClipboard = useState<boolean>(`${payloadKey}-from-clipboard`, () => false)
  const lastTransfer = useLastSearchTransferText()

  const effectiveText = computed(() => (payload.value || display.value).trim())

  watch(
    effectiveText,
    (t) => {
      if (t) lastTransfer.value = t
    },
    { immediate: true }
  )

  const hasPayload = computed(() => Boolean(payload.value))

  const payloadSize = computed(() =>
    payload.value ? formatSearchPayloadSize(payload.value) : ''
  )

  function inputPreview(): string {
    if (payload.value) return formatSearchPayloadDisplay(payload.value)
    return display.value
  }

  function ingestFullText(full: string, opts?: { fromClipboard?: boolean }) {
    if (!full.trim()) {
      clear()
      return
    }
    fromClipboard.value = opts?.fromClipboard ?? false
    if (shouldHoldSearchPayload(full)) {
      payload.value = full
      display.value = ''
      return
    }
    payload.value = ''
    display.value = full
  }

  function setDisplay(value: string) {
    if (payload.value) {
      if (value === formatSearchPayloadDisplay(payload.value)) return
      payload.value = ''
    }
    display.value = value
  }

  function clear() {
    display.value = ''
    payload.value = ''
    fromClipboard.value = false
    lastTransfer.value = ''
  }

  const query = computed({
    get: () => inputPreview(),
    set: (v: string) => setDisplay(v)
  })

  const hasQuery = computed(() => Boolean(inputPreview().trim()))

  function peekPendingClipboard(): string {
    const pending = useDesktopSearchInput().value
    return (pending?.clipboard ?? '').trim()
  }

  function transferText(): string {
    return (
      payload.value.trim() ||
      display.value.trim() ||
      peekPendingClipboard() ||
      lastTransfer.value.trim()
    )
  }

  return {
    query,
    displayQuery: computed(() => display.value.trim()),
    payload,
    fromClipboard,
    effectiveText,
    hasPayload,
    hasQuery,
    payloadSize,
    transferText,
    ingestFullText,
    setDisplay,
    clear
  }
}
