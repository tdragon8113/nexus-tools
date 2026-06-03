import { siteTools, type SiteTool } from '~/core/tools'

const STORAGE_KEY = 'nexus-tool-order-v1'

function defaultToolIds(): string[] {
  return siteTools.filter((t) => t.id !== 'more').map((t) => t.id)
}

/** 合并已保存顺序与新增工具，丢弃无效 id */
export function mergeToolOrder(saved: string[]): string[] {
  const defaults = defaultToolIds()
  const valid = saved.filter((id) => defaults.includes(id))
  const missing = defaults.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

export function useToolOrder() {
  const order = ref<string[]>(defaultToolIds())
  const loaded = ref(false)

  onMounted(() => {
    if (!import.meta.client) return
    loaded.value = true
  })

  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        if (Array.isArray(parsed)) {
          order.value = mergeToolOrder(parsed)
        }
      }
    } catch {
      order.value = defaultToolIds()
    }
  }

  function persist(next: string[]) {
    order.value = next
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
