import { showToast } from 'vant'
import { siteTools, type SiteTool } from '~~/data/siteTools'
import { detectContentHint, rankToolsForQuery } from '~/utils/toolSearch'

const PANEL_MATCH_LIMIT = 8

export function useJsonPrefill() {
  const prefill = useState<string | null>('tool-json-prefill', () => null)

  const setJsonPrefill = (value: string) => {
    prefill.value = value
  }

  const consumeJsonPrefill = (): string | null => {
    const v = prefill.value
    prefill.value = null
    return v
  }

  return { setJsonPrefill, consumeJsonPrefill }
}

export function useToolSearch() {
  const query = useState('tool-search-query', () => '')
  const panelOpen = useState('tool-search-panel-open', () => false)
  const activeIndex = useState('tool-search-active-index', () => -1)

  const { setPlainPrefill } = usePlainToolPrefill()
  const { activatePath } = useWorkbenchTabs()
  const { setJsonPrefill } = useJsonPrefill()

  const normalizedQuery = computed(() => query.value.trim())

  const jsonDetected = computed(() => {
    const q = normalizedQuery.value
    if (!q) return false
    try {
      JSON.parse(q)
      return true
    } catch {
      return false
    }
  })

  const contentHint = computed(() => detectContentHint(query.value))

  const matchedTools = computed((): SiteTool[] => rankToolsForQuery(normalizedQuery.value))

  const panelMatches = computed(() => rankToolsForQuery(normalizedQuery.value, PANEL_MATCH_LIMIT))

  const hasMoreResults = computed(
    () => matchedTools.value.length > panelMatches.value.length
  )

  const extraResultCount = computed(
    () => Math.max(0, matchedTools.value.length - panelMatches.value.length)
  )

  const showPanel = computed(
    () => panelOpen.value && Boolean(normalizedQuery.value) && (panelMatches.value.length > 0 || contentHint.value)
  )

  const selectableCount = computed(() => {
    let count = panelMatches.value.length
    if (contentHint.value) count += 1
    return count
  })

  watch(normalizedQuery, () => {
    activeIndex.value = -1
    if (normalizedQuery.value) panelOpen.value = true
  })

  const clearQuery = () => {
    query.value = ''
    activeIndex.value = -1
    panelOpen.value = false
  }

  const openPanel = () => {
    if (normalizedQuery.value) panelOpen.value = true
  }

  const closePanel = () => {
    panelOpen.value = false
    activeIndex.value = -1
  }

  function applyPrefillForTool(toolId: string, raw: string) {
    const q = raw.trim()
    if (!q) return

    const hint = detectContentHint(q)
    if (!hint || hint.toolId !== toolId) return

    if (hint.kind === 'json') {
      setJsonPrefill(q)
    } else if (
      hint.kind === 'url' ||
      hint.kind === 'timestamp' ||
      hint.kind === 'uuid' ||
      hint.kind === 'calculator' ||
      hint.kind === 'base64'
    ) {
      setPlainPrefill(hint.kind, q)
    }
  }

  const openTool = async (tool: SiteTool, options?: { withPrefill?: boolean }) => {
    if (!tool.path) {
      showToast('该工具即将上线')
      return
    }

    const withPrefill = options?.withPrefill !== false
    if (withPrefill) applyPrefillForTool(tool.id, query.value)

    await activatePath(tool.path)
    clearQuery()
  }

  const openHintTool = async () => {
    const hint = contentHint.value
    if (!hint) return
    const tool = siteTools.find((t) => t.id === hint.toolId)
    if (!tool) {
      showToast('该工具即将上线')
      return
    }
    await openTool(tool)
  }

  const openActiveItem = async () => {
    const hint = contentHint.value
    const idx = activeIndex.value

    if (hint && idx === 0) {
      await openHintTool()
      return
    }

    const toolIndex = hint ? idx - 1 : idx
    const tool = panelMatches.value[toolIndex]
    if (tool) {
      await openTool(tool)
      return
    }

    if (hint) {
      await openHintTool()
      return
    }

    if (panelMatches.value.length === 1) {
      await openTool(panelMatches.value[0])
    }
  }

  const moveActiveIndex = (delta: number) => {
    const count = selectableCount.value
    if (count === 0) {
      activeIndex.value = -1
      return
    }
    if (activeIndex.value < 0) {
      activeIndex.value = delta > 0 ? 0 : count - 1
      return
    }
    activeIndex.value = (activeIndex.value + delta + count) % count
  }

  const onSearchEnter = async () => {
    if (showPanel.value && activeIndex.value >= 0) {
      await openActiveItem()
      return
    }
    if (contentHint.value) {
      await openHintTool()
      return
    }
    const list = matchedTools.value.filter((t) => t.path)
    if (list.length === 1) {
      await openTool(list[0])
    } else if (list.length > 1) {
      panelOpen.value = true
      activeIndex.value = 0
    }
  }

  return {
    query,
    normalizedQuery,
    jsonDetected,
    contentHint,
    matchedTools,
    panelMatches,
    hasMoreResults,
    extraResultCount,
    showPanel,
    panelOpen,
    activeIndex,
    selectableCount,
    clearQuery,
    openPanel,
    closePanel,
    openTool,
    openHintTool,
    openActiveItem,
    moveActiveIndex,
    onSearchEnter
  }
}
