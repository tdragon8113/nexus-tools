export type ParseResult =
  | { ok: true; ms: number }
  | { ok: false; error: string }

/** 10 位秒、13 位毫秒、或可被 Date.parse 接受的字符串 */
export function parseTimestampFlexible(raw: string): ParseResult {
  const t = raw.trim()
  if (!t) return { ok: false, error: '请输入内容' }

  if (/^\d{10}$/.test(t)) {
    const sec = Number(t)
    return { ok: true, ms: sec * 1000 }
  }

  if (/^\d{13}$/.test(t)) {
    return { ok: true, ms: Number(t) }
  }

  const ms = Date.parse(t)
  if (!Number.isNaN(ms)) {
    return { ok: true, ms }
  }

  return { ok: false, error: '无法解析：请输入 10/13 位数字或标准日期字符串' }
}
