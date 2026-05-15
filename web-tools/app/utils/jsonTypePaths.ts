export type JsonTypeLine = { path: string; typeLabel: string }

const DEFAULT_MAX_LINES = 4000

export function collectJsonTypes(
  value: unknown,
  path = '$',
  out: JsonTypeLine[] = [],
  maxLines = DEFAULT_MAX_LINES
): JsonTypeLine[] {
  if (out.length >= maxLines) return out

  if (value === null) {
    out.push({ path, typeLabel: 'null' })
    return out
  }
  if (Array.isArray(value)) {
    out.push({ path, typeLabel: `array(${value.length})` })
    for (let i = 0; i < value.length; i++) {
      if (out.length >= maxLines) break
      collectJsonTypes(value[i], `${path}[${i}]`, out, maxLines)
    }
    return out
  }
  const t = typeof value
  if (t !== 'object') {
    out.push({ path, typeLabel: t })
    return out
  }
  out.push({ path, typeLabel: 'object' })
  for (const k of Object.keys(value as object)) {
    if (out.length >= maxLines) break
    collectJsonTypes((value as Record<string, unknown>)[k], `${path}.${k}`, out, maxLines)
  }
  return out
}
