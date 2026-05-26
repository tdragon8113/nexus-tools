import {
  registerDesktopSearchApply,
  unregisterDesktopSearchApply
} from '~/composables/desktopSearchApply'
import { takeDesktopSearchInput } from '~/composables/useDesktopSearchInput'
import { resolveDisplayToolsForQuery } from '~/core/search'
import { getToolById, type SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

const DEFAULT_LIMIT = 6

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goHub, goTool, closeDesktop } = useDesktop()
  const remeasureDesktopSearch = inject<() => void>('remeasureDesktopSearch', () => {})

  const { query, effectiveText, hasQuery, hasPayload, payloadSize, fromClipboard, transferText, ingestFullText, clear } =
    useSearchQueryPayload('desktop-search-query', 'desktop-search-query-payload')
  const rootRef = ref<HTMLElement | null>(null)
  const activeIndex = ref(0)

  const trimmed = effectiveText
  const resolved = computed(() =>
    resolveDisplayToolsForQuery(trimmed.value, limit, {
      /** 有搜索内容时允许文本编辑兜底（未识别类型且未命中工具名） */
      fallbackText: Boolean(trimmed.value)
    })
  )
  const hint = computed(() => resolved.value.hint)
  const displayTools = computed(() => resolved.value.tools)
  const showEmpty = computed(() => resolved.value.showEmpty)

  function payloadFor(tool: SiteTool): NexusOpenToolPayload | undefined {
    const text = transferText()
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
    await goTool(tool, payloadFor(tool))
  }

  async function onEnter() {
    const list = displayTools.value
    if (list.length) {
      await openTool(list[activeIndex.value] ?? list[0]!)
      return
    }
    if (!trimmed.value) return
    const textTool = getToolById('text')
    if (textTool?.path) await openTool(textTool)
  }

  function applySearchInput() {
    const pending = takeDesktopSearchInput()
    if (pending) {
      const clip = pending.clipboard?.trim()
      const q = pending.q?.trim()
      if (clip) ingestFullText(clip, { fromClipboard: true })
      else if (q) ingestFullText(q)
      return
    }
    const q = typeof route.query.q === 'string' ? route.query.q : ''
    if (q) ingestFullText(q)
  }

  function onSearchPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.trim()) return
    event.preventDefault()
    ingestFullText(text, { fromClipboard: true })
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
  watch([hint, showEmpty], scheduleRemeasure)
  watch(trimmed, scheduleRemeasure)
  watch(() => useDesktopSearchInput().value, applySearchInput, { deep: true })
  watch(() => route.query.q, applySearchInput, { immediate: true })

  onMounted(() => {
    registerDesktopSearchApply(applySearchInput)
    applySearchInput()
  })

  onUnmounted(() => {
    unregisterDesktopSearchApply(applySearchInput)
  })

  return {
    rootRef,
    query,
    hasQuery,
    hasPayload,
    payloadSize,
    clearQuery: clear,
    hint,
    displayTools,
    showEmpty,
    activeIndex,
    goHub,
    closeDesktop,
    openTool,
    onEnter,
    onSearchPaste
  }
}
