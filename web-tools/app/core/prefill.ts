import { detectContentHint } from '~/core/search'

export type PlainPrefillKind = 'url' | 'timestamp' | 'uuid' | 'calculator' | 'base64' | 'hash'

const CONTENT_PREFILL_KEY = 'tool-content-prefill'

export function useToolContentPrefill() {
  const map = useState<Record<string, string>>(CONTENT_PREFILL_KEY, () => ({}))

  const stage = (toolId: string, value: string) => {
    const v = value.trim()
    if (!v) return
    map.value = { ...map.value, [toolId]: v }
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

export function shouldApplyContentPrefill(toolId: string, raw: string): boolean {
  const q = raw.trim()
  if (!q) return false
  const hint = detectContentHint(q)
  return hint?.toolId === toolId
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

  return { setJsonPrefill, consumeJsonPrefill, prefill }
}

export function usePlainToolPrefill() {
  const url = useState<string | null>('tool-prefill-url', () => null)
  const timestamp = useState<string | null>('tool-prefill-timestamp', () => null)
  const uuid = useState<string | null>('tool-prefill-uuid', () => null)
  const calculator = useState<string | null>('tool-prefill-calculator', () => null)
  const base64 = useState<string | null>('tool-prefill-base64', () => null)
  const hash = useState<string | null>('tool-prefill-hash', () => null)

  const setPlainPrefill = (kind: PlainPrefillKind, value: string) => {
    const v = value.trim()
    if (kind === 'url') url.value = v
    else if (kind === 'timestamp') timestamp.value = v
    else if (kind === 'uuid') uuid.value = v
    else if (kind === 'calculator') calculator.value = v
    else if (kind === 'base64') base64.value = v
    else hash.value = v
  }

  const consumeUrlPrefill = (): string | null => {
    const v = url.value
    url.value = null
    return v
  }

  const consumeTimestampPrefill = (): string | null => {
    const v = timestamp.value
    timestamp.value = null
    return v
  }

  const consumeUuidPrefill = (): string | null => {
    const v = uuid.value
    uuid.value = null
    return v
  }

  const consumeCalculatorPrefill = (): string | null => {
    const v = calculator.value
    calculator.value = null
    return v
  }

  const consumeBase64Prefill = (): string | null => {
    const v = base64.value
    base64.value = null
    return v
  }

  const consumeHashPrefill = (): string | null => {
    const v = hash.value
    hash.value = null
    return v
  }

  return {
    setPlainPrefill,
    consumeUrlPrefill,
    consumeTimestampPrefill,
    consumeUuidPrefill,
    consumeCalculatorPrefill,
    consumeBase64Prefill,
    consumeHashPrefill,
    url,
    timestamp,
    uuid,
    calculator,
    base64,
    hash
  }
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

/** 按内容识别结果写入对应工具的预填状态 */
export function applyPrefillForTool(toolId: string, raw: string) {
  const q = raw.trim()
  if (!q) return
  const hint = detectContentHint(q)
  if (!hint || hint.toolId !== toolId) return

  const { stage } = useToolContentPrefill()
  stage(toolId, q)

  const { setJsonPrefill } = useJsonPrefill()
  const { setPlainPrefill } = usePlainToolPrefill()

  if (hint.kind === 'json') setJsonPrefill(q)
  else if (
    hint.kind === 'url' ||
    hint.kind === 'timestamp' ||
    hint.kind === 'uuid' ||
    hint.kind === 'calculator' ||
    hint.kind === 'base64' ||
    hint.kind === 'hash'
  ) {
    setPlainPrefill(hint.kind, q)
  }
}
