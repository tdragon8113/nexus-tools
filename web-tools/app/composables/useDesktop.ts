import {
  applyPrefillForTool,
  buildRouterPrefillState,
  clearLastSearchTransferText,
  stageToolOpenPrefill
} from '~/core/prefill'
import { triggerDesktopSearchApply } from '~/composables/desktopSearchApply'
import { resetDesktopSearchQueryState } from '~/composables/useSearchQueryPayload'
import { DESKTOP_ROUTES, desktopScreenFromPath, isElectronShell, type DesktopScreen } from '~/core/desktop'
import { getToolById, getToolByPath, type SiteTool } from '~/core/tools'
import type { ClipboardOpenSource } from '~/core/desktopClipboardPolicy'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

/** 桌面壳：导航、预填、Electron 桥接 */
export function useDesktop() {
  const route = useRoute()
  const router = useRouter()
  const pinned = useState('desktop-pinned', () => false)

  const hasElectronBridge = computed(() => isElectronShell())

  const screen = computed<DesktopScreen>(() => desktopScreenFromPath(route.path))
  const isSearchScreen = computed(() => screen.value === 'search')
  const isToolScreen = computed(() => screen.value === 'tool')
  const isSettingsScreen = computed(() => screen.value === 'settings')

  function applyPrefill(payload: NexusOpenToolPayload) {
    if (payload.prefill) applyPrefillForTool(payload.toolId, payload.prefill)
  }

  async function goSearch(opts?: {
    clipboard?: string
    q?: string
    source?: ClipboardOpenSource
  }) {
    const clip = opts?.clipboard ?? ''
    const qParam = opts?.q ?? ''
    const source = opts?.source ?? 'navigation'
    const hasExplicitInput = Boolean(clip.trim() || qParam.trim())

    if (source === 'navigation' && !hasExplicitInput) {
      resetDesktopSearchQueryState()
    }

    if (hasExplicitInput) {
      stageDesktopSearchInput({
        ...(clip.trim() ? { clipboard: clip } : {}),
        ...(qParam.trim() ? { q: qParam } : {}),
        source
      })
    }
    await router.push({ path: DESKTOP_ROUTES.search })
    await nextTick()
    await syncWindowChrome()
    triggerDesktopSearchApply()
  }

  async function goSettings() {
    await router.push({ path: DESKTOP_ROUTES.settings })
    await nextTick()
    await syncWindowChrome()
  }

  function leaveSettings() {
    if (import.meta.client && window.history.length > 1) {
      router.back()
      return
    }
    void goSearch()
  }

  async function goTool(tool: SiteTool, payload?: Partial<NexusOpenToolPayload>) {
    if (!tool.path) return
    const rawPrefill = payload?.prefill ?? ''
    const toolId = payload?.toolId ?? tool.id
    if (rawPrefill.trim()) {
      stageToolOpenPrefill(toolId, rawPrefill)
      clearLastSearchTransferText()
    }
    const state = buildRouterPrefillState(toolId, rawPrefill)
    await router.push({
      path: tool.path,
      ...(state ? { state } : {}),
      ...(rawPrefill.trim() ? { force: true } : {})
    })
    await nextTick()
    if (rawPrefill.trim()) {
      stageToolOpenPrefill(toolId, rawPrefill)
    }
    await syncWindowChrome()
  }

  function closeDesktop() {
    window.nexusDesktop?.close?.()
  }

  function resizeSearchPanel(height: number) {
    window.nexusDesktop?.resizeSearch?.(height)
  }

  async function syncWindowChrome() {
    if (!isElectronShell() || !window.nexusDesktop) return
    if (route.path === DESKTOP_ROUTES.search) {
      await window.nexusDesktop.notifySearchMode?.()
    } else {
      await window.nexusDesktop.notifyPanelMode?.(route.path)
    }
  }

  async function syncPinnedFromMain() {
    if (!hasElectronBridge.value) return
    pinned.value = await window.nexusDesktop!.getPinned!()
  }

  async function togglePin() {
    if (!hasElectronBridge.value) return
    const next = !pinned.value
    try {
      pinned.value = await window.nexusDesktop!.setPinned!(next)
    } catch (err) {
      console.error('[Nexus Tools] 图钉切换失败', err)
    }
  }

  function registerElectronBridge() {
    if (!import.meta.client || !window.nexusDesktop) return () => {}

    const offOpen = window.nexusDesktop.onOpenTool?.((payload) => {
      const tool =
        getToolById(payload.toolId) ??
        (payload.path ? getToolByPath(payload.path) : undefined)
      if (tool?.path) void goTool(tool, payload)
      else applyPrefill(payload)
    })
    const offShow = window.nexusDesktop.onShowSearch?.((payload) => {
      void goSearch({
        ...(payload.clipboard != null ? { clipboard: payload.clipboard } : {}),
        ...(payload.q != null ? { q: payload.q } : {}),
        source: payload.source ?? 'hotkey'
      })
    })
    const offPin = window.nexusDesktop.onPinnedChange?.((value) => {
      pinned.value = value
    })
    void syncPinnedFromMain()

    return () => {
      offOpen?.()
      offShow?.()
      offPin?.()
    }
  }

  return {
    hasElectronBridge,
    pinned,
    togglePin,
    screen,
    isSearchScreen,
    isToolScreen,
    isSettingsScreen,
    goSearch,
    goSettings,
    leaveSettings,
    goTool,
    closeDesktop,
    resizeSearchPanel,
    syncWindowChrome,
    syncPinnedFromMain,
    registerElectronBridge
  }
}
