import { showToast } from 'vant'
import { prefillToolFromSearch } from '~/composables/useConsumeToolPrefill'
import { rankToolsForQuery, resolveToolSearchResults } from '~/core/search'
import { siteTools, type SiteTool } from '~/core/tools'

const PANEL_MATCH_LIMIT = 8

export function useToolSearch() {
  const query = useState('tool-search-query', () => '')
  const panelOpen = useState('tool-search-panel-open', () => false)
  const activeIndex = useState('tool-search-active-index', () => -1)

  const normalizedQuery = computed(() => query.value.trim())

  const resolved = computed(() =>
    resolveToolSearchResults(normalizedQuery.value, { limit: PANEL_MATCH_LIMIT })
  )

  const contentHint = computed(() => resolved.value.hint)
  const panelMatches = computed(() => resolved.value.tools)
  const matchedTools = computed((): SiteTool[] =>
    normalizedQuery.value ? rankToolsForQuery(normalizedQuery.value) : []
  )

  const hasMoreResults = computed(
    () => resolved.value.totalCount > panelMatches.value.length
  )

  const extraResultCount = computed(() =>
    Math.max(0, resolved.value.totalCount - panelMatches.value.length)
  )

  const showPanel = computed(
    () =>
      panelOpen.value &&
      Boolean(normalizedQuery.value) &&
      (panelMatches.value.length > 0 || contentHint.value)
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

  const openTool = async (tool: SiteTool, options?: { withPrefill?: boolean }) => {
    if (!tool.path) {
      showToast('该工具即将上线')
      return
    }

    if (options?.withPrefill !== false) {
      prefillToolFromSearch(tool.id, query.value)
    }

    await navigateTo(tool.path)
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
      await openTool(panelMatches.value[0]!)
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
      await openTool(list[0]!)
    } else if (list.length > 1) {
      panelOpen.value = true
      activeIndex.value = 0
    }
  }

  return {
    query,
    normalizedQuery,
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
