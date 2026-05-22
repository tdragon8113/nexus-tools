import {
  applyPrefillForTool,
  useJsonPrefill,
  usePlainToolPrefill,
  useToolContentPrefill,
  type PlainPrefillKind
} from '~/core/prefill'

type PlainPrefillOptions = {
  plainKind?: PlainPrefillKind
  /** 为 false 时不自动 onMounted 消费（需在页面里自行调用 drain，如计算器先 restore 本地记录） */
  consumeOnMount?: boolean
}

/**
 * 工具页挂载时消费预填；并监听预填状态（SPA 从搜索再次进入同一工具页时 onMounted 不会重跑）。
 */
export function useConsumeToolPrefill(
  toolId: string,
  apply: (text: string) => void,
  options?: PlainPrefillOptions
) {
  const { consume, map } = useToolContentPrefill()
  const { consumeJsonPrefill, prefill: jsonPrefill } = useJsonPrefill()
  const plain = options?.plainKind ? usePlainToolPrefill() : null
  const plainState = plain && options ? plain[options.plainKind] : null

  function drain() {
    let text = consume(toolId)
    if (!text && toolId === 'json') text = consumeJsonPrefill()
    if (!text && options?.plainKind) text = consumePlainLegacy(options.plainKind)
    if (text) apply(text)
  }

  if (options?.consumeOnMount !== false) {
    onMounted(drain)
  }

  watch(
    () => map.value[toolId],
    (v) => {
      if (v) drain()
    }
  )

  if (toolId === 'json') {
    watch(jsonPrefill, (v) => {
      if (v) drain()
    })
  }

  if (plainState) {
    watch(plainState, (v) => {
      if (v) drain()
    })
  }

  return { drain }
}

function consumePlainLegacy(kind: PlainPrefillKind): string | null {
  const p = usePlainToolPrefill()
  switch (kind) {
    case 'url':
      return p.consumeUrlPrefill()
    case 'timestamp':
      return p.consumeTimestampPrefill()
    case 'uuid':
      return p.consumeUuidPrefill()
    case 'calculator':
      return p.consumeCalculatorPrefill()
    case 'base64':
      return p.consumeBase64Prefill()
    case 'hash':
      return p.consumeHashPrefill()
  }
}

/** 从搜索打开工具前写入预填（内容识别命中时） */
export function prefillToolFromSearch(toolId: string, raw: string) {
  applyPrefillForTool(toolId, raw)
}
