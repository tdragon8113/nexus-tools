import { prefillToolFromSearch } from '~/composables/useConsumeToolPrefill'
import { resolveDisplayToolsForQuery } from '~/core/search'
import type { SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

const DEFAULT_LIMIT = 6

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goHub, goTool, closeDesktop } = useDesktop()
  const remeasureDesktopSearch = inject<() => void>('remeasureDesktopSearch', () => {})

  const rootRef = ref<HTMLElement | null>(null)
  const query = ref('')
  const activeIndex = ref(0)

  const trimmed = computed(() => query.value.trim())
  const resolved = computed(() => resolveDisplayToolsForQuery(trimmed.value, limit))
  const hint = computed(() => resolved.value.hint)
  const displayTools = computed(() => resolved.value.tools)
  const showEmpty = computed(() => resolved.value.showEmpty)

  function payloadFor(tool: SiteTool): NexusOpenToolPayload | undefined {
    const h = hint.value
    if (!h || h.toolId !== tool.id || !trimmed.value) return undefined
    return { path: tool.path!, toolId: tool.id, prefill: trimmed.value, hintKind: h.kind }
  }

  async function openTool(tool: SiteTool) {
    if (!tool.path) return
    prefillToolFromSearch(tool.id, trimmed.value)
    await goTool(tool, payloadFor(tool))
  }

  async function onEnter() {
    const list = displayTools.value
    if (list.length) await openTool(list[activeIndex.value] ?? list[0]!)
  }

  function applySearchInput() {
    const fromIpc = consumeDesktopSearchInput()
    if (fromIpc) {
      query.value = fromIpc
      return
    }
    const q = typeof route.query.q === 'string' ? route.query.q : ''
    if (q) query.value = q
  }

  watch(trimmed, () => {
    activeIndex.value = 0
  })
  watch(displayTools, (list) => {
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, list.length - 1))
    void nextTick(remeasureDesktopSearch)
  })
  watch([hint, showEmpty], () => {
    void nextTick(remeasureDesktopSearch)
  })
  watch(() => useDesktopSearchInput().value, applySearchInput, { deep: true })
  watch(() => route.query.q, applySearchInput, { immediate: true })
  onMounted(applySearchInput)

  return {
    rootRef,
    query,
    hint,
    displayTools,
    showEmpty,
    activeIndex,
    goHub,
    closeDesktop,
    openTool,
    onEnter
  }
}
