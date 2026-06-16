/** 去掉常见 JS 包裹，便于从对象/数组字面量转为 JSON */
export function stripJsValueWrapper(text: string): string {
  let s = text.trim()
  while (s.endsWith(';')) {
    s = s.slice(0, -1).trimEnd()
  }

  const rules: RegExp[] = [
    /^export\s+default\s+/,
    /^module\.exports\s*=\s*/,
    /^(?:const|let|var)\s+[\w$]+\s*=\s+/
  ]

  for (const rule of rules) {
    if (rule.test(s)) {
      return s.replace(rule, '').trim()
    }
  }

  return s
}

function jsonFormatCandidates(source: string): string[] {
  const trimmed = source.trim()
  if (!trimmed) return []

  const stripped = stripJsValueWrapper(trimmed)
  const out = [trimmed]
  if (stripped !== trimmed) out.push(stripped)
  return [...new Set(out)]
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/**
 * 将文本规范为 JSON：先尝试严格 JSON，再用 JSON5 解析 JS/JSON5 字面量。
 * 用于从 JavaScript 语法切换或格式化为 JSON。
 */
export async function formatJsonSource(source: string): Promise<string> {
  const trimmed = source.trim()
  if (!trimmed) return source

  const candidates = jsonFormatCandidates(trimmed)
  let lastError: Error | null = null

  for (const candidate of candidates) {
    try {
      return prettyJson(JSON.parse(candidate))
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }

  const { default: JSON5 } = await import('json5')
  for (const candidate of candidates) {
    try {
      return prettyJson(JSON5.parse(candidate))
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw lastError ?? new Error('无法解析为 JSON')
}
