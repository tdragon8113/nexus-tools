import { siteTools, type SiteTool } from '~/core/tools'
import { persistRendererLocalStateKeyFireAndForget } from '~/core/rendererLocalState'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

const STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.toolOrder
const ORDER_STATE_KEY = 'nexus-tool-order-state'

function defaultToolIds(): string[] {
  return siteTools.filter((t) => t.id !== 'more').map((t) => t.id)
}

function readStoredOrder(): string[] {
  if (!import.meta.client) return defaultToolIds()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultToolIds()
    const parsed = JSON.parse(raw) as string[]
    if (Array.isArray(parsed)) return mergeToolOrder(parsed)
  } catch {
    /* ignore corrupt storage */
  }
  return defaultToolIds()
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

export function useToolOrder() {
  const order = useState<string[]>(ORDER_STATE_KEY, readStoredOrder)
  const loaded = useState(`${ORDER_STATE_KEY}-loaded`, () => false)

  onMounted(() => {
    if (!import.meta.client) return
    loaded.value = true
  })

  function persist(next: string[]) {
    order.value = next
    if (import.meta.client) {
      persistRendererLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(next))
    }
  }

  const orderedTools = computed(() => {
    const map = new Map(siteTools.map((t) => [t.id, t]))
    return order.value
      .map((id) => map.get(id))
      .filter((t): t is SiteTool => Boolean(t))
  })

  function moveTool(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const next = [...order.value]
    const [id] = next.splice(fromIndex, 1)
    if (!id) return
    next.splice(toIndex, 0, id)
    persist(next)
  }

  function setOrder(ids: string[]) {
    persist(mergeToolOrder(ids))
  }

  return {
    order,
    loaded,
    orderedTools,
    moveTool,
    setOrder
  }
}
