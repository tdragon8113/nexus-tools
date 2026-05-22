import { applyPrefillForTool } from '~/core/prefill'
import { resolveDisplayToolsForQuery } from '~/core/search'
import type { SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

const DEFAULT_LIMIT = 6

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goHub, goTool, closeDesktop, resizeSearchPanel } = useDesktop()

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
    applyPrefillForTool(tool.id, trimmed.value)
    await goTool(tool, payloadFor(tool))
  }

  async function onEnter() {
    const list = displayTools.value
    if (list.length) await openTool(list[activeIndex.value] ?? list[0]!)
  }

  function moveActive(delta: number) {
    const n = displayTools.value.length
    if (n === 0) return
    activeIndex.value = (activeIndex.value + delta + n) % n
  }

  function onHorizontalKey(e: KeyboardEvent, delta: number) {
    if (displayTools.value.length === 0) return
    const el = e.target as HTMLInputElement | null
    if (!el || el.tagName !== 'INPUT') return
    if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return
    const pos = el.selectionStart ?? 0
    const end = el.selectionEnd ?? pos
    const len = el.value.length
    if (pos !== end) return
    if (delta < 0 && pos > 0) return
    if (delta > 0 && pos < len) return
    e.preventDefault()
    moveActive(delta)
  }

  function syncQueryFromRoute() {
    const clip = typeof route.query.clipboard === 'string' ? route.query.clipboard : ''
    const q = typeof route.query.q === 'string' ? route.query.q : ''
    const next = q || clip
    if (next) query.value = next
  }

  useElementResize(rootRef, resizeSearchPanel)

  watch(trimmed, () => {
    activeIndex.value = 0
  })
  watch(displayTools, (list) => {
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, list.length - 1))
  })
  watch(() => [route.query.clipboard, route.query.q], syncQueryFromRoute, { immediate: true })

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
    onEnter,
    moveActive,
    onHorizontalKey
  }
}
