import { parseTree, visit, type JSONPath, type ParseError } from 'jsonc-parser'
import type { IndentMode } from '~/utils/jsonTool'
import { getIndent } from '~/utils/jsonTool'

function pathId(path: JSONPath): string {
  return JSON.stringify(path)
}

/** 从源码提取每个对象层级的键顺序（与文本中出现顺序一致） */
export function extractSourceKeyOrders(text: string): Map<string, string[]> | null {
  const errs: ParseError[] = []
  parseTree(text, errs)
  if (errs.length > 0) return null

  const map = new Map<string, string[]>()
  visit(
    text,
    {
      onObjectProperty(prop, _o, _l, _sl, _sc, pathSupplier) {
        const path = pathSupplier()
        const id = pathId(path)
        let arr = map.get(id)
        if (!arr) {
          arr = []
          map.set(id, arr)
        }
        arr.push(prop)
      }
    },
    { disallowComments: true }
  )
  return map
}

/** 重复键保留首次出现位置（与常见 JSON 语义一致） */
function dedupeKeyOrder(keys: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const k of keys) {
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  return out
}

function orderedObjectKeys(o: Record<string, unknown>, path: JSONPath, orderMap: Map<string, string[]>): string[] {
  const fromSource = orderMap.get(pathId(path))
  const own = Object.keys(o)
  if (!fromSource?.length) return own
  const ordered = dedupeKeyOrder(fromSource)
  const rest = own.filter((k) => !ordered.includes(k))
  return [...ordered.filter((k) => Object.prototype.hasOwnProperty.call(o, k)), ...rest]
}

function indentUnit(mode: string | number): string {
  return typeof mode === 'number' ? ' '.repeat(mode) : mode
}

/** 美化输出，对象键顺序与源码一致 */
export function stringifyPrettyWithSourceOrder(
  value: unknown,
  orderMap: Map<string, string[]>,
  indentMode: IndentMode
): string {
  const ind = getIndent(indentMode)
  const unit = indentUnit(ind)

  function pretty(v: unknown, path: JSONPath, depth: number): string {
    if (v === null) return 'null'
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (typeof v === 'number') {
      if (Number.isNaN(v) || !Number.isFinite(v)) return 'null'
      return String(v)
    }
    if (typeof v === 'string') return JSON.stringify(v)
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]'
      const inner = v
        .map((item, i) => `${unit.repeat(depth + 1)}${pretty(item, [...path, i], depth + 1)}`)
        .join(',\n')
      return `[\n${inner}\n${unit.repeat(depth)}]`
    }
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>
      const keys = orderedObjectKeys(o, path, orderMap)
      if (keys.length === 0) return '{}'
      const inner = keys
        .map((k) => {
          const keyStr = JSON.stringify(k)
          const sub = pretty(o[k], [...path, k], depth + 1)
          return `${unit.repeat(depth + 1)}${keyStr}: ${sub}`
        })
        .join(',\n')
      return `{\n${inner}\n${unit.repeat(depth)}}`
    }
    return 'null'
  }

  return pretty(value, [], 0)
}

/** 单行压缩，键顺序仍与源码一致 */
export function stringifyCompactWithSourceOrder(value: unknown, orderMap: Map<string, string[]>): string {
  function compact(v: unknown, path: JSONPath): string {
    if (v === null) return 'null'
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (typeof v === 'number') {
      if (Number.isNaN(v) || !Number.isFinite(v)) return 'null'
      return String(v)
    }
    if (typeof v === 'string') return JSON.stringify(v)
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]'
      return `[${v.map((item, i) => compact(item, [...path, i])).join(',')}]`
    }
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>
      const keys = orderedObjectKeys(o, path, orderMap)
      if (keys.length === 0) return '{}'
      return `{${keys.map((k) => `${JSON.stringify(k)}:${compact(o[k], [...path, k])}`).join(',')}}`
    }
    return 'null'
  }
  return compact(value, [])
}
