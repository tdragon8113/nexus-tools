import { showToast } from 'vant'
import { siteTools, type SiteTool } from '~~/data/siteTools'

export type ContentHintKind = 'json' | 'url' | 'timestamp' | 'uuid'

export interface ContentHint {
  kind: ContentHintKind
  toolId: string
  label: string
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toolMatchesQuery(tool: SiteTool, q: string): boolean {
  const lower = q.toLowerCase().trim()
  if (!lower) return true
  if (tool.name.toLowerCase().includes(lower)) return true
  if (tool.desc.toLowerCase().includes(lower)) return true
  if (tool.id.toLowerCase().includes(lower)) return true
  if (tool.keywords?.some((k) => k.toLowerCase().includes(lower))) return true
  return false
}

/** 根据粘贴/输入内容推断最可能工具（JSON 优先用 parse 校验） */
export function detectContentHint(raw: string): ContentHint | null {
  const t = raw.trim()
  if (!t) return null

  try {
    JSON.parse(t)
    return { kind: 'json', toolId: 'json', label: 'JSON 数据' }
  } catch {
    /* not JSON */
  }

  const firstLine = t.split(/\r?\n/)[0]?.trim() ?? t
  const firstToken = firstLine.split(/\s+/)[0] ?? firstLine

  if (/^https?:\/\//i.test(firstToken) || /^[a-z][a-z0-9+.-]*:\/\//i.test(firstToken)) {
    try {
      new URL(firstToken)
      return { kind: 'url', toolId: 'url', label: 'URL 链接' }
    } catch {
      /* ignore */
    }
  }

  if (/^\d{10}$/.test(t) || /^\d{13}$/.test(t)) {
    return { kind: 'timestamp', toolId: 'timestamp', label: 'Unix 时间戳' }
  }

  if (UUID_RE.test(t)) {
    return { kind: 'uuid', toolId: 'uuid', label: 'UUID' }
  }

  return null
}

export function useJsonPrefill() {
  const prefill = useState<string | null>('tool-json-prefill', () => null)

  const setJsonPrefill = (value: string) => {
    prefill.value = value
  }

  const consumeJsonPrefill = (): string | null => {
    const v = prefill.value
    prefill.value = null
    return v
  }

  return { setJsonPrefill, consumeJsonPrefill }
}

export function useToolSearch() {
  const query = useState('tool-search-query', () => '')

  const normalizedQuery = computed(() => query.value.trim())

  const jsonDetected = computed(() => {
    const q = normalizedQuery.value
    if (!q) return false
    try {
      JSON.parse(q)
      return true
    } catch {
      return false
    }
  })

  const contentHint = computed(() => detectContentHint(query.value))

  const matchedTools = computed((): SiteTool[] => {
    const q = normalizedQuery.value
    if (!q) return siteTools

    if (jsonDetected.value) {
      const jsonTool = siteTools.find((t) => t.id === 'json')
      const rest = siteTools.filter((t) => t.id !== 'json')
      return jsonTool ? [jsonTool, ...rest] : siteTools
    }

    const hint = contentHint.value
    if (hint) {
      const primary = siteTools.find((t) => t.id === hint.toolId)
      if (primary) {
        const rest = siteTools.filter((t) => t.id !== hint.toolId)
        const restMatched = rest.filter((t) => toolMatchesQuery(t, q))
        return [primary, ...restMatched]
      }
    }

    const filtered = siteTools.filter((t) => toolMatchesQuery(t, q))
    return filtered
  })

  const clearQuery = () => {
    query.value = ''
  }

  const { setJsonPrefill } = useJsonPrefill()

  const openHintTool = async () => {
    const hint = contentHint.value
    const q = normalizedQuery.value
    if (!hint || !q) return

    const tool = siteTools.find((t) => t.id === hint.toolId)
    if (!tool?.path) {
      showToast('该工具即将上线')
      return
    }

    if (hint.kind === 'json' && jsonDetected.value) {
      setJsonPrefill(q)
    }

    await navigateTo(tool.path)
    clearQuery()
  }

  /** 回车：有内容识别则打开；否则仅有一个匹配且可跳转则打开 */
  const onSearchEnter = async () => {
    if (contentHint.value) {
      await openHintTool()
      return
    }
    const list = matchedTools.value
    if (list.length === 1 && list[0].path) {
      await navigateTo(list[0].path)
    }
  }

  return {
    query,
    normalizedQuery,
    jsonDetected,
    contentHint,
    matchedTools,
    clearQuery,
    openHintTool,
    onSearchEnter
  }
}
