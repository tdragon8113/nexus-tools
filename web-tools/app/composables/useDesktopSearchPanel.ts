import {
  registerDesktopSearchApply,
  unregisterDesktopSearchApply
} from '~/composables/desktopSearchApply'
import { useDesktopClipboardPrefs } from '~/composables/useDesktopClipboardPrefs'
import { takeDesktopSearchInput } from '~/composables/useDesktopSearchInput'
import { decideClipboardIngest, hashClipboardText, summarizeClipboardOffer } from '~/core/desktopClipboardPolicy'
import { useLastSearchTransferText } from '~/core/prefill'
import { resolveDisplayToolsForQuery } from '~/core/search'
import { getToolById, type SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

const DEFAULT_LIMIT = 6

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goHub, goTool, closeDesktop } = useDesktop()
  const remeasureDesktopSearch = inject<() => void>('remeasureDesktopSearch', () => {})
  const clipboardPrefs = useDesktopClipboardPrefs()
  const pendingSearchInput = useDesktopSearchInput()

  const lastSearchTransfer = useLastSearchTransferText()
  const { query, effectiveText, hasQuery, hasPayload, payloadSize, fromClipboard, transferText, ingestFullText, clear } =
    useSearchQueryPayload('desktop-search-query', 'desktop-search-query-payload')
  const rootRef = ref<HTMLElement | null>(null)
  const activeIndex = ref(0)
  const clipboardOfferText = ref('')
  const clipboardOfferLabel = ref('')

  const trimmed = effectiveText
  const resolved = computed(() =>
    resolveDisplayToolsForQuery(trimmed.value, limit, {
      fallbackText: Boolean(trimmed.value)
    })
  )
  const hint = computed(() => resolved.value.hint)
  const displayTools = computed(() => resolved.value.tools)
  const showEmpty = computed(() => resolved.value.showEmpty)
  const hasClipboardOffer = computed(() => Boolean(clipboardOfferText.value.trim()))

  /** 打开工具时携带的全文：搜索框 / 大 payload / 未接受的剪贴板提示 / 最近搜索缓存 */
  function resolveTransferTextForOpen(): string {
    const fromSearch = transferText().trim()
    if (fromSearch) return fromSearch
    const offer = clipboardOfferText.value.trim()
    if (offer) return offer
    return lastSearchTransfer.value.trim()
  }

  function payloadFor(tool: SiteTool): NexusOpenToolPayload | undefined {
    const text = resolveTransferTextForOpen()
    if (!text || !tool.path) return undefined
    const h = hint.value
    return {
      path: tool.path,
      toolId: tool.id,
      prefill: text,
      ...(h && h.toolId === tool.id ? { hintKind: h.kind } : {})
    }
  }

  async function openTool(tool: SiteTool) {
    if (!tool.path) return
    const payload = payloadFor(tool)
    if (payload?.prefill) clearClipboardOffer()
    await goTool(tool, payload)
  }

  async function onEnter() {
    if (hasClipboardOffer.value) {
      await acceptClipboardOffer()
      return
    }
    const list = displayTools.value
    if (list.length) {
      await openTool(list[activeIndex.value] ?? list[0]!)
      return
    }
    if (!trimmed.value) return
    const textTool = getToolById('text')
    if (textTool?.path) await openTool(textTool)
  }

  function clearClipboardOffer() {
    clipboardOfferText.value = ''
    clipboardOfferLabel.value = ''
  }

  function showClipboardOffer(text: string) {
    clipboardOfferText.value = text
    clipboardOfferLabel.value = summarizeClipboardOffer(text)
    scheduleRemeasure()
  }

  async function acceptClipboardOffer() {
    const text = clipboardOfferText.value.trim()
    if (!text) return
    const hash = hashClipboardText(text)
    ingestFullText(text, { fromClipboard: true })
    clearClipboardOffer()
    await clipboardPrefs.markClipboardApplied(hash)
  }

  async function dismissClipboardOffer() {
    const text = clipboardOfferText.value.trim()
    if (text) {
      await clipboardPrefs.dismissClipboardHash(hashClipboardText(text))
    }
    clearClipboardOffer()
  }

  async function ingestFromClipboard(text: string) {
    const hash = hashClipboardText(text)
    ingestFullText(text, { fromClipboard: true })
    clearClipboardOffer()
    await clipboardPrefs.markClipboardApplied(hash)
  }

  async function applySearchInput() {
    if (!clipboardPrefs.loaded.value) await clipboardPrefs.syncFromMain()

    const pending = takeDesktopSearchInput()
    if (pending) {
      const clip = pending.clipboard?.trim()
      const q = pending.q?.trim()
      const source = pending.source ?? 'hotkey'

      if (clip) {
        const decision = decideClipboardIngest({
          policy: clipboardPrefs.policy.value,
          source,
          text: clip,
          lastAppliedHash: clipboardPrefs.lastAppliedHash.value,
          dismissedHash: clipboardPrefs.dismissedHash.value
        })
        if (decision.action === 'autofill') {
          await ingestFromClipboard(clip)
          return
        }
        if (decision.action === 'hint') {
          showClipboardOffer(clip)
          return
        }
      }

      if (q) {
        clearClipboardOffer()
        ingestFullText(q)
      }
      return
    }

    const q = typeof route.query.q === 'string' ? route.query.q : ''
    if (q) {
      clearClipboardOffer()
      ingestFullText(q)
    }
  }

  async function clearQuery() {
    if (hasClipboardOffer.value) {
      await dismissClipboardOffer()
    }
    clear()
  }

  function onSearchPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.trim()) return
    event.preventDefault()
    clearClipboardOffer()
    void ingestFromClipboard(text)
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' && hasClipboardOffer.value && !event.shiftKey) {
      event.preventDefault()
      void acceptClipboardOffer()
      return
    }
    if (event.key === 'Escape') {
      if (hasClipboardOffer.value) {
        event.preventDefault()
        void dismissClipboardOffer()
        return
      }
      event.preventDefault()
      closeDesktop()
    }
  }

  watch(trimmed, () => {
    activeIndex.value = 0
  })

  function scheduleRemeasure() {
    void nextTick(() => {
      remeasureDesktopSearch()
      requestAnimationFrame(remeasureDesktopSearch)
    })
  }

  watch(displayTools, (list) => {
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, list.length - 1))
    scheduleRemeasure()
  })
  watch([hint, showEmpty, hasClipboardOffer], scheduleRemeasure)
  watch(trimmed, scheduleRemeasure)
  watch(pendingSearchInput, () => void applySearchInput(), { deep: true })
  watch(() => route.query.q, () => void applySearchInput(), { immediate: true })

  function runApplySearchInput() {
    void applySearchInput()
  }

  onMounted(() => {
    void clipboardPrefs.syncFromMain().then(() => {
      registerDesktopSearchApply(runApplySearchInput)
      void applySearchInput()
    })
  })

  onUnmounted(() => {
    unregisterDesktopSearchApply(runApplySearchInput)
  })

  return {
    rootRef,
    query,
    hasQuery,
    hasPayload,
    payloadSize,
    clearQuery,
    hint,
    displayTools,
    showEmpty,
    activeIndex,
    hasClipboardOffer,
    clipboardOfferLabel,
    acceptClipboardOffer,
    dismissClipboardOffer,
    goHub,
    closeDesktop,
    openTool,
    onEnter,
    onSearchPaste,
    onSearchKeydown
  }
}
