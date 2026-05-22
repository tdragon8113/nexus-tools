import { detectContentHint } from '~/core/search'

export type PlainPrefillKind = 'url' | 'timestamp' | 'uuid' | 'calculator' | 'base64'

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

export function usePlainToolPrefill() {
  const url = useState<string | null>('tool-prefill-url', () => null)
  const timestamp = useState<string | null>('tool-prefill-timestamp', () => null)
  const uuid = useState<string | null>('tool-prefill-uuid', () => null)
  const calculator = useState<string | null>('tool-prefill-calculator', () => null)
  const base64 = useState<string | null>('tool-prefill-base64', () => null)

  const setPlainPrefill = (kind: PlainPrefillKind, value: string) => {
    const v = value.trim()
    if (kind === 'url') url.value = v
    else if (kind === 'timestamp') timestamp.value = v
    else if (kind === 'uuid') uuid.value = v
    else if (kind === 'calculator') calculator.value = v
    else base64.value = v
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

  return {
    setPlainPrefill,
    consumeUrlPrefill,
    consumeTimestampPrefill,
    consumeUuidPrefill,
    consumeCalculatorPrefill,
    consumeBase64Prefill
  }
}

/** 按内容识别结果写入对应工具的预填状态 */
export function applyPrefillForTool(toolId: string, raw: string) {
  const q = raw.trim()
  if (!q) return
  const hint = detectContentHint(q)
  if (!hint || hint.toolId !== toolId) return

  const { setJsonPrefill } = useJsonPrefill()
  const { setPlainPrefill } = usePlainToolPrefill()

  if (hint.kind === 'json') setJsonPrefill(q)
  else if (
    hint.kind === 'url' ||
    hint.kind === 'timestamp' ||
    hint.kind === 'uuid' ||
    hint.kind === 'calculator' ||
    hint.kind === 'base64'
  ) {
    setPlainPrefill(hint.kind, q)
  }
}
