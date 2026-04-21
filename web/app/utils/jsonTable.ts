/** 将 JSON 转为表格：优先「对象数组」矩阵，否则为路径-值扁平表 */

export type JsonObjectTable = {
  kind: 'objects'
  columns: string[]
  rows: Record<string, unknown>[]
}

export type JsonKvTable = {
  kind: 'kv'
  rows: { path: string; value: string }[]
}

export type JsonTableModel = JsonObjectTable | JsonKvTable

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function buildJsonTable(value: unknown): JsonTableModel {
  if (Array.isArray(value) && value.length > 0) {
    const allObjects = value.every(isPlainObject)
    if (allObjects) {
      const colOrder: string[] = []
      const seen = new Set<string>()
      for (const item of value) {
        for (const k of Object.keys(item)) {
          if (!seen.has(k)) {
            seen.add(k)
            colOrder.push(k)
          }
        }
      }
      return { kind: 'objects', columns: colOrder, rows: value as Record<string, unknown>[] }
    }
  }

  const rows: { path: string; value: string }[] = []

  function walk(v: unknown, path: string) {
    if (v === null) {
      rows.push({ path, value: 'null' })
      return
    }
    const t = typeof v
    if (t !== 'object') {
      rows.push({ path, value: JSON.stringify(v) })
      return
    }
    if (Array.isArray(v)) {
      if (v.length === 0) {
        rows.push({ path, value: '[]' })
        return
      }
      v.forEach((item, i) => walk(item, `${path}[${i}]`))
      return
    }
    const o = v as Record<string, unknown>
    const keys = Object.keys(o)
    if (keys.length === 0) {
      rows.push({ path, value: '{}' })
      return
    }
    for (const k of keys) walk(o[k], path === '$' ? k : `${path}.${k}`)
  }

  walk(value, '$')
  return { kind: 'kv', rows }
}

export function cellPreview(v: unknown): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    const s = JSON.stringify(v)
    return s.length > 200 ? `${s.slice(0, 197)}…` : s
  } catch {
    return String(v)
  }
}
