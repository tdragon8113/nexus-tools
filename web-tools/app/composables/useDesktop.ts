import { applyPrefillForTool, buildRouterPrefillState } from '~/core/prefill'
import { triggerDesktopSearchApply } from '~/composables/desktopSearchApply'
import { DESKTOP_ROUTES, desktopScreenFromPath, isElectronShell, type DesktopScreen } from '~/core/desktop'
import { getToolById, getToolByPath, type SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

/** 桌面壳：导航、预填、Electron 桥接 */
export function useDesktop() {
  const route = useRoute()
  const router = useRouter()
  const pinned = useState('desktop-pinned', () => false)

  const hasElectronBridge = computed(() => isElectronShell())

  const screen = computed<DesktopScreen>(() => desktopScreenFromPath(route.path))
  const isSearchScreen = computed(() => screen.value === 'search')
  const isHubScreen = computed(() => screen.value === 'hub')
  const isToolScreen = computed(() => screen.value === 'tool')

  function applyPrefill(payload: NexusOpenToolPayload) {
    if (payload.prefill) applyPrefillForTool(payload.toolId, payload.prefill)
  }

  async function goSearch(opts?: { clipboard?: string; q?: string }) {
    const clip = opts?.clipboard ?? ''
    const qParam = opts?.q ?? ''
    if (clip.trim() || qParam.trim()) {
      stageDesktopSearchInput({
        ...(clip.trim() ? { clipboard: clip } : {}),
        ...(qParam.trim() ? { q: qParam } : {})
      })
    }
    await router.push({ path: DESKTOP_ROUTES.search })
    await nextTick()
    await syncWindowChrome()
    triggerDesktopSearchApply()
  }

  async function goHub() {
    await router.push({ path: DESKTOP_ROUTES.hub })
    await nextTick()
    await syncWindowChrome()
  }

  async function goTool(tool: SiteTool, payload?: Partial<NexusOpenToolPayload>) {
    if (!tool.path) return
    const rawPrefill = payload?.prefill ?? ''
    const toolId = payload?.toolId ?? tool.id
    if (rawPrefill.trim()) {
      applyPrefillForTool(toolId, rawPrefill)
    }
    const state = buildRouterPrefillState(toolId, rawPrefill)
    await router.push({
      path: tool.path,
      ...(state ? { state } : {})
    })
    await nextTick()
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
        ...(payload.q != null ? { q: payload.q } : {})
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
    isHubScreen,
    isToolScreen,
    goSearch,
    goHub,
    goTool,
    closeDesktop,
    resizeSearchPanel,
    syncWindowChrome,
    syncPinnedFromMain,
    registerElectronBridge
  }
}
