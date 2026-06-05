import { siteTools } from '~/core/tools'

export const TOOL_ORDER_STATE_KEY = 'nexus-tool-order-state'

export function defaultToolIds(): string[] {
  return siteTools.map((t) => t.id)
}

/** 合并已保存顺序与新增工具，丢弃无效 id */
export function mergeToolOrder(saved: string[]): string[] {
  const defaults = defaultToolIds()
  const valid = saved.filter((id) => defaults.includes(id))
  const missing = defaults.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

/** 将 catalog 区新顺序合并进全局工具顺序（保留最近使用/收藏等固定区工具的原槽位） */
export function mergeCatalogToolOrder(fullOrder: string[], catalogToolIds: string[]): string[] {
  const catalogSet = new Set(catalogToolIds)
  const queue = [...catalogToolIds]
  return fullOrder.map((id) => (catalogSet.has(id) ? queue.shift()! : id))
}

export function initialToolOrder(): string[] {
  return mergeToolOrder([])
}
