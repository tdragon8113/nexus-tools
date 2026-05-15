export type PlainPrefillKind = 'url' | 'timestamp' | 'uuid'

/**
 * 从首页搜索「打开工具」时写入、在目标页 onMounted 消费，避免 URL 带长文本。
 */
export function usePlainToolPrefill() {
  const url = useState<string | null>('tool-prefill-url', () => null)
  const timestamp = useState<string | null>('tool-prefill-timestamp', () => null)
  const uuid = useState<string | null>('tool-prefill-uuid', () => null)

  const setPlainPrefill = (kind: PlainPrefillKind, value: string) => {
    const v = value.trim()
    if (kind === 'url') url.value = v
    else if (kind === 'timestamp') timestamp.value = v
    else uuid.value = v
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

  return {
    setPlainPrefill,
    consumeUrlPrefill,
    consumeTimestampPrefill,
    consumeUuidPrefill
  }
}
