import { shallowRef } from 'vue'

/** 路由 state 携带预填，避免导航与内存预填消费竞态 */
export const ROUTER_TOOL_PREFILL_KEY = 'nexusToolPrefill'
export const ROUTER_TOOL_PREFILL_FOR_KEY = 'nexusToolPrefillFor'

/**
 * 模块级 ref：IPC / onMounted / watch 可能在 Nuxt setup 外读写，不能用 useState。
 */
const lastSearchTransferText = shallowRef('')

const toolContentPrefillMap = shallowRef<Record<string, string>>({})

/** 搜索/IPC 打开指定工具时暂存，仅允许目标 toolId 消费（避免串工具） */
const pendingToolOpenPrefill = shallowRef<{ toolId: string; text: string } | null>(null)

export function useLastSearchTransferText() {
  return lastSearchTransferText
}

/** 预填已消费或从工具集中性导航时调用，避免污染其他工具 */
export function clearLastSearchTransferText() {
  lastSearchTransferText.value = ''
}

export function readRouterToolPrefill(toolId: string): string | null {
  if (!import.meta.client || !toolId) return null
  const state = history.state as Record<string, unknown> | null
  if (!state) return null
  const forTool = state[ROUTER_TOOL_PREFILL_FOR_KEY]
  if (forTool !== toolId) return null
  const v = state[ROUTER_TOOL_PREFILL_KEY]
  if (typeof v === 'string' && v.length > 0) return v
  return null
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
  const stage = (toolId: string, value: string) => {
    if (!value) return
    toolContentPrefillMap.value = { ...toolContentPrefillMap.value, [toolId]: value }
  }

  const consume = (toolId: string): string | null => {
    const v = toolContentPrefillMap.value[toolId]
    if (!v) return null
    const next = { ...toolContentPrefillMap.value }
    delete next[toolId]
    toolContentPrefillMap.value = next
    return v
  }

  return { map: toolContentPrefillMap, stage, consume }
}

/** 写入工具预填 map（IPC 等仅写入、尚未导航时） */
export function applyPrefillForTool(toolId: string, raw: string) {
  if (!raw.trim()) return
  toolContentPrefillMap.value = {
    ...toolContentPrefillMap.value,
    [toolId]: raw
  }
}

/** 搜索打开工具：map + 按 toolId 暂存，供目标页 drain */
export function stageToolOpenPrefill(toolId: string, raw: string) {
  const text = raw.trim()
  if (!text || !toolId) return
  pendingToolOpenPrefill.value = { toolId, text }
  applyPrefillForTool(toolId, text)
}

export function takePendingToolOpenPrefill(toolId: string): string | null {
  const pending = pendingToolOpenPrefill.value
  if (!pending || pending.toolId !== toolId) return null
  pendingToolOpenPrefill.value = null
  return pending.text
}

export function clearPendingToolOpenPrefill(toolId?: string) {
  if (!toolId || pendingToolOpenPrefill.value?.toolId === toolId) {
    pendingToolOpenPrefill.value = null
  }
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
