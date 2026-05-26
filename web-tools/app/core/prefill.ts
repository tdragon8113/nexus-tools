const CONTENT_PREFILL_KEY = 'tool-content-prefill'
const LAST_SEARCH_TEXT_KEY = 'desktop-last-search-text'

/** 路由 state 携带预填，避免导航与 useState 消费竞态 */
export const ROUTER_TOOL_PREFILL_KEY = 'nexusToolPrefill'
export const ROUTER_TOOL_PREFILL_FOR_KEY = 'nexusToolPrefillFor'

export function useLastSearchTransferText() {
  return useState<string>(LAST_SEARCH_TEXT_KEY, () => '')
}

export function readRouterToolPrefill(toolId: string): string | null {
  if (!import.meta.client || !toolId) return null
  const state = history.state as Record<string, unknown> | null
  if (!state) return null
  const forTool = state[ROUTER_TOOL_PREFILL_FOR_KEY]
  if (forTool !== toolId) return null
  const v = state[ROUTER_TOOL_PREFILL_KEY]
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function clearRouterToolPrefill() {
  if (!import.meta.client) return
  const state = history.state as Record<string, unknown> | null
  if (!state) return
  const next = { ...state }
  delete next[ROUTER_TOOL_PREFILL_KEY]
  delete next[ROUTER_TOOL_PREFILL_FOR_KEY]
  history.replaceState(next, '')
}

export function useToolContentPrefill() {
  const map = useState<Record<string, string>>(CONTENT_PREFILL_KEY, () => ({}))

  const stage = (toolId: string, value: string) => {
    if (!value) return
    map.value = { ...map.value, [toolId]: value }
  }

  const consume = (toolId: string): string | null => {
    const v = map.value[toolId]
    if (!v) return null
    const next = { ...map.value }
    delete next[toolId]
    map.value = next
    return v
  }

  return { map, stage, consume }
}

/** 写入工具预填（搜索 / IPC 打开工具时调用） */
export function applyPrefillForTool(toolId: string, raw: string) {
  if (!raw.trim()) return
  useToolContentPrefill().stage(toolId, raw)
}

/** 路由 push 时附带的状态（与 {@link readRouterToolPrefill} 成对） */
export function buildRouterPrefillState(
  toolId: string,
  prefill: string
): Record<string, string> | undefined {
  if (!prefill.trim()) return undefined
  return {
    [ROUTER_TOOL_PREFILL_KEY]: prefill,
    [ROUTER_TOOL_PREFILL_FOR_KEY]: toolId
  }
}
