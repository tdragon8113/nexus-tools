import { isElectronShell } from '~/core/desktop'
import { TOOL_ORDER_STATE_KEY, mergeToolOrder } from '~/core/toolOrder'
import {
  MANAGED_RENDERER_LOCAL_STATE_KEYS,
  type RendererLocalStateMap
} from '~~/shared/rendererLocalState'
import type { SearchFavoriteEntry, SearchRecentEntry } from '~~/shared/searchState'

const CACHE_STATE_KEY = 'desktop-local-state-cache'
const HYDRATED_STATE_KEY = 'desktop-local-state-hydrated'
const MAX_RECENTS = 3

function readLegacyLocalStorage(key: string): string | null {
  if (!import.meta.client) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function clearLegacyLocalStorage(key: string) {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function parseRecents(raw: string | null | undefined): SearchRecentEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as SearchRecentEntry[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : []
  } catch {
    return []
  }
}

function parseFavorites(raw: string | null | undefined): SearchFavoriteEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as SearchFavoriteEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseToolOrder(raw: string | null | undefined): string[] {
  if (!raw) return mergeToolOrder([])
  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? mergeToolOrder(parsed) : mergeToolOrder([])
  } catch {
    return mergeToolOrder([])
  }
}

function applyParsedState(state: RendererLocalStateMap) {
  const recents = useState<SearchRecentEntry[]>('search-recents', () => [])
  const favorites = useState<SearchFavoriteEntry[]>('search-favorites', () => [])
  const order = useState<string[]>(TOOL_ORDER_STATE_KEY, () => mergeToolOrder([]))

  recents.value = parseRecents(state['nexus-search-recents-v1'])
  favorites.value = parseFavorites(state['nexus-search-favorites-v1'])
  order.value = parseToolOrder(state['nexus-tool-order-v1'])
}

/** 启动时从主进程 userData 加载到内存；旧 localStorage 仅一次性迁移 */
export async function hydrateDesktopLocalStateFromMain(): Promise<void> {
  if (!import.meta.client) return

  const cache = useState<RendererLocalStateMap>(CACHE_STATE_KEY, () => ({}))
  const hydrated = useState(HYDRATED_STATE_KEY, () => false)
  if (hydrated.value) {
    applyParsedState(cache.value)
    return
  }

  let fromMain: RendererLocalStateMap = {}

  if (isElectronShell() && window.nexusDesktop?.getRendererLocalState) {
    try {
      fromMain = await window.nexusDesktop.getRendererLocalState()
    } catch (err) {
      console.error('[Nexus Tools] 读取本地状态失败', err)
    }
  }

  const legacyPatch: RendererLocalStateMap = {}
  for (const key of MANAGED_RENDERER_LOCAL_STATE_KEYS) {
    if (fromMain[key]) continue
    const legacy = readLegacyLocalStorage(key)
    if (legacy) legacyPatch[key] = legacy
  }

  if (
    Object.keys(legacyPatch).length > 0 &&
    isElectronShell() &&
    window.nexusDesktop?.patchRendererLocalState
  ) {
    try {
      fromMain = await window.nexusDesktop.patchRendererLocalState(legacyPatch)
      for (const key of Object.keys(legacyPatch)) {
        clearLegacyLocalStorage(key)
      }
    } catch (err) {
      console.error('[Nexus Tools] 迁移 localStorage 到 userData 失败', err)
      fromMain = { ...fromMain, ...legacyPatch }
    }
  } else if (!isElectronShell()) {
    fromMain = { ...fromMain, ...legacyPatch }
  }

  cache.value = fromMain
  applyParsedState(fromMain)
  hydrated.value = true
}

export function getDesktopLocalStateValue(key: string): string | null {
  if (!import.meta.client) return null
  const cache = useState<RendererLocalStateMap>(CACHE_STATE_KEY, () => ({}))
  return cache.value[key] ?? null
}

export async function persistDesktopLocalStateKey(key: string, value: string): Promise<void> {
  if (!import.meta.client) return

  const cache = useState<RendererLocalStateMap>(CACHE_STATE_KEY, () => ({}))
  cache.value = { ...cache.value, [key]: value }

  if (!isElectronShell() || !window.nexusDesktop?.patchRendererLocalState) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
    return
  }

  try {
    const next = await window.nexusDesktop.patchRendererLocalState({ [key]: value })
    cache.value = { ...cache.value, ...next }
    clearLegacyLocalStorage(key)
  } catch (err) {
    console.error('[Nexus Tools] 保存本地状态失败', err)
  }
}

export function persistDesktopLocalStateKeyFireAndForget(key: string, value: string) {
  void persistDesktopLocalStateKey(key, value)
}
