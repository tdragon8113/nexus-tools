import {
  registerDesktopSearchApply,
  unregisterDesktopSearchApply
} from '~/composables/desktopSearchApply'
import { useDesktopClipboardPrefs } from '~/composables/useDesktopClipboardPrefs'
import { takeDesktopSearchInput } from '~/composables/useDesktopSearchInput'
import { copyWithToast } from '~/composables/useCopyText'
import { useMacAppIconCache } from '~/composables/useMacAppIconCache'
import { useSearchRecents } from '~/composables/useSearchRecents'
import { decideClipboardIngest, hashClipboardText, summarizeClipboardOffer } from '~/core/desktopClipboardPolicy'
import { useLastSearchTransferText } from '~/core/prefill'
import { buildMacAppSearchPreview, buildToolSearchPreview } from '~/core/searchPreview'
import { mergeSearchResults, type SearchResultItem } from '~/core/searchResults'
import { resolveToolsByContent, resolveToolsByName } from '~/core/search'
import { siteTools, type SiteTool } from '~/core/tools'
import type { MacAppEntry } from '~~/shared/macApps'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

const DEFAULT_LIMIT = 8

export interface SearchPanelAction {
  id: string
  label: string
  shortcut?: string
  run: () => void | Promise<void>
}

function defaultSuggestions(): SiteTool[] {
  return siteTools.filter((tool) => tool.path && tool.id !== 'more').slice(0, 6)
}

function tagSection(items: SearchResultItem[], section?: string): SearchResultItem[] {
  if (!section) return items
  return items.map((item) => ({ ...item, section }))
}

export function useDesktopSearchPanel(limit = DEFAULT_LIMIT) {
  const route = useRoute()
  const { goHub, goTool, goSettings, closeDesktop } = useDesktop()
  const remeasureDesktopSearch = inject<() => void>('remeasureDesktopSearch', () => {})
  const clipboardPrefs = useDesktopClipboardPrefs()
  const pendingSearchInput = useDesktopSearchInput()
  const { syncFromStorage, recordItem, resolveRecentItems } = useSearchRecents()

  const lastSearchTransfer = useLastSearchTransferText()
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
  const actionsOpen = ref(false)
  const actionIndex = ref(0)
  const clipboardOfferText = ref('')
  const clipboardOfferLabel = ref('')

  const { apps, loadMacApps, matchMacApps, openMacApp } = useMacApps()
  const { prefetch: prefetchMacAppIcons } = useMacAppIconCache()
  const MAC_APP_LIMIT = 6

  const commandTrimmed = computed(() => commandQuery.value.trim())
  const queryTrimmed = computed(() => queryText.value.trim())

  const nameResolved = computed(() => resolveToolsByName(commandTrimmed.value, limit))
  const contentResolved = computed(() =>
    resolveToolsByContent(queryTrimmed.value, limit, { fallbackText: true })
  )
  const hint = computed(() => contentResolved.value.hint)

  const displayTools = computed(() => {
    if (commandTrimmed.value) return nameResolved.value.tools
    if (queryTrimmed.value) return contentResolved.value.tools
    return defaultSuggestions()
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

  const searchItems = computed(() => {
    const merged = mergeSearchResults(displayTools.value, displayMacApps.value)

    if (commandTrimmed.value) {
      return tagSection(merged, merged.length ? 'Results' : undefined)
    }

    if (queryTrimmed.value) {
      return tagSection(merged, merged.length ? '内容匹配' : undefined)
    }

    const recents = resolveRecentItems(apps.value)
    const recentIds = new Set(recents.map((row) => row.id))
    const suggestions = merged.filter((row) => !recentIds.has(row.id))
    const out: SearchResultItem[] = []

    if (recents.length) out.push(...tagSection(recents, '最近使用'))
    if (suggestions.length) {
      out.push(...tagSection(suggestions, recents.length ? '建议' : undefined))
    }
    return out
  })

  const showEmpty = computed(() => {
    if (commandTrimmed.value) {
      return nameResolved.value.showEmpty && displayMacApps.value.length === 0
    }
    if (queryTrimmed.value) return contentResolved.value.showEmpty
    return false
  })
  const selectableCount = computed(() => searchItems.value.length)
  const hasClipboardOffer = computed(() => Boolean(clipboardOfferText.value.trim()))

  const selectedItem = computed<SearchResultItem | null>(() => {
    if (!searchItems.value.length) return null
    const idx = Math.min(activeIndex.value, searchItems.value.length - 1)
    return searchItems.value[idx] ?? null
  })

  /** Query 始终可见：内容匹配与预览不依赖先选中工具 */
  const showQueryEditor = computed(() => true)

  const preview = computed(() => {
    const item = selectedItem.value
    const q = queryTrimmed.value

    if (item?.kind === 'mac-app' && item.app) {
      return buildMacAppSearchPreview(item.app.name, item.app.path)
    }

    const toolId =
      item?.kind === 'tool' && item.tool
        ? item.tool.id
        : displayTools.value[0]?.id ?? hint.value?.toolId

    if (toolId && q) {
      return buildToolSearchPreview(toolId, q, hint.value)
    }

    if (item?.kind === 'tool' && item.tool) {
      return buildToolSearchPreview(item.tool.id, q, hint.value)
    }

    return null
  })

  const footerPrimaryLabel = computed(() => {
    const item = selectedItem.value
    if (!item) return '继续'
    if (item.kind === 'mac-app') return '打开应用'
    if (item.kind === 'tool') return '打开工具'
    return '继续'
  })

  function resolveTransferTextForOpen(): string {
    const fromQuery = transferText().trim()
    if (fromQuery) return fromQuery
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

  const panelActions = computed((): SearchPanelAction[] => {
    const list: SearchPanelAction[] = []
    const item = selectedItem.value
    const copy = preview.value?.copyText?.trim()

    if (item?.kind === 'mac-app') {
      list.push({
        id: 'primary',
        label: '打开应用',
        shortcut: '↵',
        run: () => runPrimaryAction()
      })
    } else if (item?.kind === 'tool' && item.tool) {
      list.push({
        id: 'primary',
        label: '打开工具',
        shortcut: '↵',
        run: () => runPrimaryAction()
      })
    }

    if (copy) {
      list.push({
        id: 'copy-preview',
        label: '复制预览内容',
        run: async () => {
          await copyWithToast(copy, '已复制到剪贴板')
        }
      })
    }

    if (queryText.value.trim()) {
      list.push({
        id: 'copy-query',
        label: '复制 Query',
        run: async () => {
          await copyWithToast(queryText.value, '已复制 Query')
        }
      })
    }

    if (hasClipboardOffer.value) {
      list.push({
        id: 'paste-clipboard',
        label: '将剪贴板填入 Query',
        shortcut: 'Tab',
        run: () => acceptClipboardOffer()
      })
    }

    if (commandQuery.value.trim() || hasQueryEditor.value || hasPayload.value) {
      list.push({
        id: 'clear',
        label: '清空搜索与 Query',
        run: () => clearQuery()
      })
    }

    list.push({ id: 'hub', label: '打开工具集', run: () => goHub() })
    list.push({ id: 'settings', label: '打开设置', run: () => goSettings() })
    list.push({ id: 'close', label: '关闭窗口', shortcut: 'Esc', run: () => closeDesktop() })

    return list
  })

  async function runPanelAction(action: SearchPanelAction | undefined) {
    if (!action) return
    actionsOpen.value = false
    await action.run()
  }

  async function onEnter(event: KeyboardEvent) {
    if (actionsOpen.value) {
      event.preventDefault()
      await runPanelAction(panelActions.value[actionIndex.value])
      return
    }
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

  function clearAll() {
    commandQuery.value = ''
    clearQueryEditor()
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
    headerRef.value?.focusQuery()
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
    headerRef.value?.focusQuery()
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
        commandQuery.value = q
      }
      return
    }

    const q = typeof route.query.q === 'string' ? route.query.q : ''
    if (q) {
      clearClipboardOffer()
      commandQuery.value = q
    }
  }

  async function clearQuery() {
    if (hasClipboardOffer.value) {
      await dismissClipboardOffer()
    }
    clearAll()
  }

  function toggleActionsMenu() {
    actionsOpen.value = !actionsOpen.value
    if (actionsOpen.value) actionIndex.value = 0
  }

  function onQueryPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.trim()) return
    event.preventDefault()
    clearClipboardOffer()
    void ingestFromClipboard(text)
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      toggleActionsMenu()
      return
    }

    if (actionsOpen.value) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        actionIndex.value = Math.min(actionIndex.value + 1, Math.max(0, panelActions.value.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        actionIndex.value = Math.max(actionIndex.value - 1, 0)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        actionsOpen.value = false
        return
      }
      return
    }

    if (event.key === 'Tab' && hasClipboardOffer.value && !event.shiftKey) {
      event.preventDefault()
      void acceptClipboardOffer()
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
      if (hasClipboardOffer.value) {
        event.preventDefault()
        void dismissClipboardOffer()
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

  watch(panelActions, (list) => {
    actionIndex.value = Math.min(actionIndex.value, Math.max(0, list.length - 1))
  })

  function scheduleRemeasure() {
    void nextTick(() => {
      remeasureDesktopSearch()
      requestAnimationFrame(remeasureDesktopSearch)
    })
  }

  watch(searchItems, () => {
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, selectableCount.value - 1))
    scheduleRemeasure()
  })
  watch([preview, showEmpty, hasClipboardOffer, commandQuery, queryText, actionsOpen, showQueryEditor], scheduleRemeasure)
  watch(pendingSearchInput, () => void applySearchInput(), { deep: true })
  watch(() => route.query.q, () => void applySearchInput(), { immediate: true })

  function runApplySearchInput() {
    void applySearchInput()
  }

  onMounted(() => {
    syncFromStorage()
    void loadMacApps()
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
    selectedItem,
    preview,
    showEmpty,
    activeIndex,
    footerPrimaryLabel,
    hasClipboardOffer,
    clipboardOfferLabel,
    acceptClipboardOffer,
    dismissClipboardOffer,
    actionsOpen,
    actionIndex,
    panelActions,
    runPanelAction,
    toggleActionsMenu,
    goHub,
    closeDesktop,
    pickItem,
    onEnter,
    onQueryPaste,
    onSearchKeydown,
    setQueryEditor,
    clearQueryContent
  }
}
