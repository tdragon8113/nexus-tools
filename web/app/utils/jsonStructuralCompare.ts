/** 全量路径行数上限（含一致项） */
export const STRUCTURAL_DIFF_MAX_ROWS = 8000

export type StructuralDiffRow = {
  path: string
  left: string
  right: string
  /** = 同路径一致；≠ 类型或值不同；A / B 仅一侧存在 */
  gutter: '=' | '≠' | 'A' | 'B'
  mismatch: 'equal' | 'value' | 'type' | 'missing'
}

function jsonType(v: unknown): 'null' | 'array' | 'object' | 'primitive' {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object') return 'object'
  return 'primitive'
}

export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const aa = a as unknown[]
    const bb = b as unknown[]
    if (aa.length !== bb.length) return false
    return aa.every((v, i) => deepEqualJson(v, bb[i]))
  }
  const oa = a as Record<string, unknown>
  const ob = b as Record<string, unknown>
  const keysA = Object.keys(oa).sort()
  const keysB = Object.keys(ob).sort()
  if (keysA.length !== keysB.length) return false
  if (!keysA.every((k, i) => k === keysB[i])) return false
  return keysA.every((k) => deepEqualJson(oa[k], ob[k]))
}

function joinPath(base: string, key: string): string {
  const seg = /^[a-zA-Z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`
  return base === '$' ? `$${seg}` : `${base}${seg}`
}

export function previewJsonValue(v: unknown, maxLen = 160): string {
  if (v === null) return 'null'
  const t = typeof v
  if (t === 'string' || t === 'number' || t === 'boolean') {
    const s = JSON.stringify(v)
    return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s
  }
  if (Array.isArray(v)) return `[ … 共 ${v.length} 项 ]`
  return `{ … 共 ${Object.keys(v as object).length} 键 }`
}

/**
 * 递归展开所有路径：对象、数组逐层下钻；叶子（含 null）一行；
 * 一致标 =，不一致标 ≠ / A / B。便于在完整上下文中定位差异。
 */
function fullWalk(a: unknown, b: unknown, path: string, out: StructuralDiffRow[], cap: { stop: boolean }): void {
  if (cap.stop) return
  if (out.length >= STRUCTURAL_DIFF_MAX_ROWS) {
    cap.stop = true
    return
  }

  const ta = jsonType(a)
  const tb = jsonType(b)
  if (ta !== tb) {
    out.push({
      path,
      left: previewJsonValue(a),
      right: previewJsonValue(b),
      gutter: '≠',
      mismatch: 'type'
    })
    return
  }

  if (ta === 'primitive' || ta === 'null') {
    const eq = deepEqualJson(a, b)
    out.push({
      path,
      left: previewJsonValue(a),
      right: previewJsonValue(b),
      gutter: eq ? '=' : '≠',
      mismatch: eq ? 'equal' : 'value'
    })
    return
  }

  if (ta === 'array') {
    const aa = a as unknown[]
    const bb = b as unknown[]
    if (aa.length === 0 && bb.length === 0) {
      out.push({ path, left: '[]', right: '[]', gutter: '=', mismatch: 'equal' })
      return
    }
    const max = Math.max(aa.length, bb.length)
    for (let i = 0; i < max; i++) {
      if (out.length >= STRUCTURAL_DIFF_MAX_ROWS) {
        cap.stop = true
        return
      }
      const p = `${path}[${i}]`
      if (i >= aa.length) {
        out.push({ path: p, left: '', right: previewJsonValue(bb[i]), gutter: 'B', mismatch: 'missing' })
      } else if (i >= bb.length) {
        out.push({ path: p, left: previewJsonValue(aa[i]), right: '', gutter: 'A', mismatch: 'missing' })
      } else {
        fullWalk(aa[i], bb[i], p, out, cap)
      }
    }
    return
  }

  const oa = a as Record<string, unknown>
  const ob = b as Record<string, unknown>
  const keys = [...new Set([...Object.keys(oa), ...Object.keys(ob)])].sort()
  if (keys.length === 0) {
    out.push({ path, left: '{}', right: '{}', gutter: '=', mismatch: 'equal' })
    return
  }
  for (const k of keys) {
    if (out.length >= STRUCTURAL_DIFF_MAX_ROWS) {
      cap.stop = true
      return
    }
    const p = joinPath(path, k)
    const ha = Object.prototype.hasOwnProperty.call(oa, k)
    const hb = Object.prototype.hasOwnProperty.call(ob, k)
    if (!ha) {
      out.push({ path: p, left: '', right: previewJsonValue(ob[k]), gutter: 'B', mismatch: 'missing' })
    } else if (!hb) {
      out.push({ path: p, left: previewJsonValue(oa[k]), right: '', gutter: 'A', mismatch: 'missing' })
    } else {
      fullWalk(oa[k], ob[k], p, out, cap)
    }
  }
}

export function structuralDiffRows(a: unknown, b: unknown): { rows: StructuralDiffRow[]; capped: boolean } {
  const out: StructuralDiffRow[] = []
  const cap = { stop: false }
  fullWalk(a, b, '$', out, cap)
  return { rows: out, capped: cap.stop || out.length >= STRUCTURAL_DIFF_MAX_ROWS }
}

/** 是否为「不一致」行（用于 ↑↓ 仅跳差异） */
export function isStructuralMismatchRow(row: StructuralDiffRow): boolean {
  return row.gutter !== '='
}
