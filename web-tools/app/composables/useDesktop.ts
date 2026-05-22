import { applyPrefillForTool } from '~/core/prefill'
import {
  DESKTOP_QUERY_VALUE,
  DESKTOP_ROUTES,
  desktopQuery,
  desktopScreenFromPath,
  isDesktopQuery,
  type DesktopScreen
} from '~/core/desktop'
import type { SiteTool } from '~/core/tools'
import type { NexusOpenToolPayload } from '~/types/nexus-desktop'

export { DESKTOP_QUERY_VALUE as DESKTOP_VAL, desktopQuery, isDesktopQuery }

export function isDesktopRoute(route = useRoute()) {
  return isDesktopQuery(route.query as Record<string, unknown>)
}

/** 桌面壳：导航、预填、Electron 桥接 */
export function useDesktop() {
  const route = useRoute()
  const router = useRouter()

  const isDesktop = computed(() => import.meta.client && isDesktopRoute(route))
  const screen = computed<DesktopScreen>(() => desktopScreenFromPath(route.path))
  const isSearchScreen = computed(() => screen.value === 'search')
  const isHubScreen = computed(() => screen.value === 'hub')
  const isToolScreen = computed(() => screen.value === 'tool')

  function applyPrefill(payload: NexusOpenToolPayload) {
    if (payload.prefill) applyPrefillForTool(payload.toolId, payload.prefill)
  }

  async function goSearch(opts?: { clipboard?: string; q?: string }) {
    await router.push({
      path: DESKTOP_ROUTES.search,
      query: desktopQuery({
        ...(opts?.clipboard ? { clipboard: opts.clipboard } : {}),
        ...(opts?.q ? { q: opts.q } : {})
      })
    })
  }

  async function goHub() {
    await router.push({ path: DESKTOP_ROUTES.hub, query: desktopQuery() })
  }

  async function goTool(tool: SiteTool, payload?: Partial<NexusOpenToolPayload>) {
    if (!tool.path) return
    if (payload?.prefill) {
      applyPrefill({
        path: tool.path,
        toolId: tool.id,
        ...payload
      } as NexusOpenToolPayload)
    }
    await router.push({ path: tool.path, query: desktopQuery() })
  }

  function closeDesktop() {
    window.nexusDesktop?.close?.()
  }

  function resizeSearchPanel(height: number) {
    window.nexusDesktop?.resizeSearch?.(height)
  }

  function syncWindowChrome() {
    if (!import.meta.client || !window.nexusDesktop || !isDesktopRoute(route)) return
    if (route.path === DESKTOP_ROUTES.search) {
      window.nexusDesktop.notifySearchMode?.()
    } else {
      window.nexusDesktop.notifyPanelMode?.(route.path)
    }
  }

  function registerElectronBridge() {
    if (!import.meta.client || !window.nexusDesktop) return () => {}

    const offOpen = window.nexusDesktop.onOpenTool?.(applyPrefill)
    const offShow = window.nexusDesktop.onShowSearch?.((payload) => {
      void goSearch({
        clipboard: payload.clipboard ?? '',
        q: payload.q ?? ''
      })
    })

    return () => {
      offOpen?.()
      offShow?.()
    }
  }

  return {
    isDesktop,
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
    registerElectronBridge
  }
}
