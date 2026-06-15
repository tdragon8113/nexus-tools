import {
  registerDesktopSearchApply,
  unregisterDesktopSearchApply
} from '~/composables/desktopSearchApply'
import { useMacAppIconCache } from '~/composables/useMacAppIconCache'
import { useSearchClipboardOffer } from '~/composables/useSearchClipboardOffer'
import { useSearchFavorites } from '~/composables/useSearchFavorites'
import { useSearchRecents } from '~/composables/useSearchRecents'
import { useToolOrder } from '~/composables/useToolOrder'
import { useLastSearchTransferText } from '~/core/prefill'
import { buildDesktopSearchItems } from '~/core/desktopSearchList'
import type { SearchResultItem } from '~/core/searchResults'
import { resolveToolsByContent, resolveToolsByName } from '~/core/search'
import type { SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'
import { showToast } from 'vant'

const DEFAULT_LIMIT = 8

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goTool, closeDesktop } = useDesktop()
  const remeasureDesktopSearch = inject<() => void>('remeasureDesktopSearch', () => {})
  const { syncFromStorage, recordItem, resolveRecentItems } = useSearchRecents()
  const {
    syncFromStorage: syncFavoritesFromStorage,
    isFavorite,
    toggleFavorite,
    resolveFavoriteItems,
    prioritizeFavorites
  } = useSearchFavorites()

  const lastSearchTransfer = useLastSearchTransferText()
  const { orderedTools } = useToolOrder()
  const commandQuery = useState('desktop-search-command', () => '')
  const {
    query: queryEditor,
    effectiveText: queryText,
    hasQuery: hasQueryEditor,
    hasPayload,
    payloadSize,
    transferText,
    ingestFullText,
    setDisplay: setQueryEditor,
    clear: clearQueryEditor
  } = useSearchQueryPayload('desktop-search-query', 'desktop-search-query-payload')

  const rootRef = ref<HTMLElement | null>(null)
  const headerRef = ref<{ focusCommand: () => void; focusQuery: () => void } | null>(null)
  const activeIndex = ref(0)
  const queryFocused = ref(false)
  const resultContextMenu = ref<{
    item: SearchResultItem
    x: number
    y: number
  } | null>(null)

  const { apps, loadMacApps, matchMacApps, openMacApp } = useMacApps()
  const { prefetch: prefetchMacAppIcons } = useMacAppIconCache()
  const MAC_APP_LIMIT = 6

  const commandTrimmed = computed(() => commandQuery.value.trim())
  const queryTrimmed = computed(() => queryText.value.trim())

  const nameResolved = computed(() => resolveToolsByName(commandTrimmed.value, limit))
  const contentResolved = computed(() =>
    resolveToolsByContent(queryTrimmed.value, limit)
  )
  const hint = computed(() => contentResolved.value.hint)

  const allBrowsableTools = computed(() =>
    orderedTools.value.filter((tool) => Boolean(tool.path))
  )

  const displayTools = computed(() => {
    if (commandTrimmed.value) return nameResolved.value.tools
    if (queryTrimmed.value) return contentResolved.value.tools
    return allBrowsableTools.value
  })

  const displayMacApps = computed(() => {
    if (!commandTrimmed.value) return []
    return matchMacApps(commandTrimmed.value, MAC_APP_LIMIT)
  })

  watch(
    displayMacApps,
    (rows) => {
      prefetchMacAppIcons(rows.map((a) => a.path))
    },
    { immediate: true }
  )

  function scheduleRemeasure() {
    void nextTick(() => {
      remeasureDesktopSearch()
      requestAnimationFrame(remeasureDesktopSearch)
    })
  }

  function focusCommandField() {
    queryFocused.value = false
    void nextTick(() => headerRef.value?.focusCommand())
  }

  const clipboard = useSearchClipboardOffer({
    commandQuery,
    getExistingQueryText: () => queryText.value,
    ingestFullText,
    scheduleRemeasure
  })

  const searchItems = computed(() =>
    buildDesktopSearchItems({
      commandTrimmed: commandTrimmed.value,
      queryTrimmed: queryTrimmed.value,
      displayTools: displayTools.value,
      displayMacApps: displayMacApps.value,
      macApps: apps.value,
      prioritizeFavorites,
      resolveFavoriteItems,
      resolveRecentItems
    })
  )

  const showEmpty = computed(() => {
    if (commandTrimmed.value) {
      return nameResolved.value.showEmpty && displayMacApps.value.length === 0
    }
    if (queryTrimmed.value) return contentResolved.value.showEmpty
    return false
  })
  const selectableCount = computed(() => searchItems.value.length)

  const reorderEnabled = computed(
    () =>
      !commandTrimmed.value &&
      !queryTrimmed.value &&
      allBrowsableTools.value.length > 1
  )

  const selectedItem = computed<SearchResultItem | null>(() => {
    if (!searchItems.value.length) return null
    const idx = Math.min(activeIndex.value, searchItems.value.length - 1)
    return searchItems.value[idx] ?? null
  })

  const showQueryEditor = computed(() => true)

  function resolveTransferTextForOpen(): string {
    const fromQuery = transferText().trim()
    if (fromQuery) return fromQuery
    const offer = clipboard.offerText.value.trim()
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
    if (payload?.prefill) {
      clipboard.clearOffer()
      await clipboard.markQueryTextAsApplied(payload.prefill)
    }
    await goTool(tool, payload)
  }

  async function runPrimaryAction() {
    const item = selectedItem.value
    if (!item) return

    if (item.kind === 'mac-app' && item.app) {
      const ok = await openMacApp(item.app)
      if (ok) {
        recordItem(item)
        closeDesktop()
      }
      return
    }

    if (item.kind === 'tool' && item.tool) {
      await openTool(item.tool)
      recordItem(item)
    }
  }

  async function onEnter() {
    await runPrimaryAction()
  }

  async function pickItem(item: SearchResultItem) {
    const index = searchItems.value.findIndex((row) => row.id === item.id)
    if (index >= 0) activeIndex.value = index
    await runPrimaryAction()
  }

  function clearQueryContent() {
    clearQueryEditor()
  }

  function clearCommandContent() {
    commandQuery.value = ''
  }

  function openResultContextMenu(item: SearchResultItem, event: MouseEvent) {
    resultContextMenu.value = { item, x: event.clientX, y: event.clientY }
  }

  function closeResultContextMenu() {
    resultContextMenu.value = null
  }

  function confirmResultContextMenuFavorite() {
    const item = resultContextMenu.value?.item
    if (!item) return
    const added = toggleFavorite(item)
    showToast(added ? '已加入收藏' : '已取消收藏')
    closeResultContextMenu()
    scheduleRemeasure()
  }

  function clearAll() {
    commandQuery.value = ''
    clearQueryEditor()
  }

  async function clearQuery() {
    if (clipboard.hasOffer.value) {
      await clipboard.dismissOffer()
    }
    clearAll()
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' && clipboard.hasOffer.value && !event.shiftKey) {
      event.preventDefault()
      void clipboard.acceptOffer()
      return
    }
    if (event.key === 'ArrowDown' && selectableCount.value > 0) {
      event.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, selectableCount.value - 1)
      return
    }
    if (event.key === 'ArrowUp' && selectableCount.value > 0) {
      event.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      return
    }
    if (event.key === 'Escape') {
      if (resultContextMenu.value) {
        event.preventDefault()
        closeResultContextMenu()
        return
      }
      if (clipboard.hasOffer.value) {
        event.preventDefault()
        void clipboard.dismissOffer()
        return
      }
      event.preventDefault()
      closeDesktop()
    }
  }

  watch(commandQuery, () => {
    activeIndex.value = 0
  })

  watch(queryText, () => {
    if (!commandTrimmed.value) activeIndex.value = 0
  })

  watch(searchItems, () => {
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, selectableCount.value - 1))
    scheduleRemeasure()
  })
  watch(
    [showEmpty, clipboard.hasOffer, commandQuery, queryText, showQueryEditor],
    scheduleRemeasure
  )
  async function syncPendingSearchInput() {
    await clipboard.applyPendingInput()
    focusCommandField()
  }

  watch(clipboard.pendingSearchInput, () => void syncPendingSearchInput(), { deep: true })
  watch(() => route.query.q, () => void syncPendingSearchInput(), { immediate: true })

  function runApplySearchInput() {
    void syncPendingSearchInput()
  }

  onMounted(() => {
    syncFromStorage()
    syncFavoritesFromStorage()
    void loadMacApps()
    void clipboard.clipboardPrefs.syncFromMain().then(() => {
      registerDesktopSearchApply(runApplySearchInput)
      void syncPendingSearchInput()
    })
  })

  onUnmounted(() => {
    unregisterDesktopSearchApply(runApplySearchInput)
  })

  return {
    rootRef,
    headerRef,
    commandQuery,
    queryEditor,
    queryFocused,
    showQueryEditor,
    hasQueryEditor,
    hasPayload,
    payloadSize,
    clearQuery,
    hint,
    searchItems,
    showEmpty,
    reorderEnabled,
    scheduleRemeasure,
    activeIndex,
    hasClipboardOffer: clipboard.hasOffer,
    clipboardOfferLabel: clipboard.offerLabel,
    acceptClipboardOffer: clipboard.acceptOffer,
    dismissClipboardOffer: clipboard.dismissOffer,
    closeDesktop,
    pickItem,
    onEnter,
    onQueryPaste: clipboard.onQueryPaste,
    onSearchKeydown,
    setQueryEditor,
    clearQueryContent,
    clearCommandContent,
    isFavorite,
    resultContextMenu,
    openResultContextMenu,
    closeResultContextMenu,
    confirmResultContextMenuFavorite
  }
}
