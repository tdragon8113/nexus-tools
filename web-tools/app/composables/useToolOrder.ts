import { siteTools, type SiteTool } from '~/core/tools'
import { persistDesktopLocalStateKeyFireAndForget } from '~/core/desktopLocalState'
import { initialToolOrder, mergeToolOrder, TOOL_ORDER_STATE_KEY } from '~/core/toolOrder'
import { RENDERER_LOCAL_STATE_KEYS } from '~~/shared/rendererLocalState'

export { mergeCatalogToolOrder, mergeToolOrder } from '~/core/toolOrder'

const STORAGE_KEY = RENDERER_LOCAL_STATE_KEYS.toolOrder

export function useToolOrder() {
  const order = useState<string[]>(TOOL_ORDER_STATE_KEY, initialToolOrder)
  const loaded = useState(`${TOOL_ORDER_STATE_KEY}-loaded`, () => false)

  onMounted(() => {
    if (!import.meta.client) return
    loaded.value = true
  })

  function persist(next: string[]) {
    order.value = next
    if (import.meta.client) {
      persistDesktopLocalStateKeyFireAndForget(STORAGE_KEY, JSON.stringify(next))
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
