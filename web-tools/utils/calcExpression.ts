export type CalcResult = { ok: true; value: number } | { ok: false; error: string }

const ALLOWED = /^[0-9+\-*/.%^()\s]+$/
const ALLOWED_CHAR = /[0-9+\-*/.%^()\s]/

function stripSpaces(s: string): string {
  return s.replace(/\s+/g, '')
}

/** 将常见全角 / Unicode 运算符转为 ASCII，便于从文档粘贴。 */
function normalizeOperators(raw: string): string {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−|﹣|－/g, '-')
    .replace(/＋/g, '+')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/％/g, '%')
    .replace(/。/g, '.')
    .replace(/＾/g, '^')
}

/** 去除浮点噪声后展示 */
export function formatCalcResult(n: number): string {
  if (Number.isNaN(n)) return 'NaN'
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞'
  const rounded = Math.round(n * 1e12) / 1e12
  if (Number.isInteger(rounded)) return String(rounded)
  const t = String(rounded)
  return t.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '')
}

class Parser {
  private readonly s: string
  private i = 0

  constructor(s: string) {
    this.s = s
  }

  private peek(): string {
    return this.s[this.i] ?? ''
  }

  parse(): number {
    if (!this.s.length) throw new Error('表达式为空')
    const v = this.parseExpr()
    if (this.i < this.s.length) {
      throw new Error(`意外字符「${this.peek()}」`)
    }
    return v
  }

  private parseExpr(): number {
    let v = this.parseTerm()
    for (;;) {
      if (this.peek() === '+') {
        this.i++
        v += this.parseTerm()
      } else if (this.peek() === '-') {
        this.i++
        v -= this.parseTerm()
      } else {
        break
      }
    }
    return v
  }

  private parseTerm(): number {
    let v = this.parseFactor()
    for (;;) {
      if (this.peek() === '*') {
        this.i++
        v *= this.parseFactor()
      } else if (this.peek() === '/') {
        this.i++
        const r = this.parseFactor()
        if (r === 0) throw new Error('不能除以 0')
        v /= r
      } else if (this.peek() === '%') {
        this.i++
        const r = this.parseFactor()
        if (r === 0) throw new Error('不能对 0 取模')
        v %= r
      } else {
        break
      }
    }
    return v
  }

  /** 一元正负号；-2^2 按惯例为 -(2^2)。 */
  private parseFactor(): number {
    let sign = 1
    for (;;) {
      if (this.peek() === '+') {
        this.i++
      } else if (this.peek() === '-') {
        this.i++
        sign = -sign
      } else {
        break
      }
    }
    const v = this.parsePowerTail()
    return sign * v
  }

  /** 幂运算，右结合：2^3^2 = 2^9。 */
  private parsePowerTail(): number {
    const base = this.parsePrimary()
    if (this.peek() === '^') {
      this.i++
      const exp = this.parseFactor()
      return Math.pow(base, exp)
    }
    return base
  }

  private parsePrimary(): number {
    if (this.peek() === '(') {
      this.i++
      const inner = this.parseExpr()
      if (this.peek() !== ')') throw new Error('缺少右括号「)」')
      this.i++
      return inner
    }
    return this.parseNumber()
  }

  private parseNumber(): number {
    const rest = this.s.slice(this.i)
    const m = rest.match(/^\d+(\.\d*)?|^\.\d+/)
    if (!m) throw new Error('此处需要数字')
    this.i += m[0].length
    const n = Number(m[0])
    if (Number.isNaN(n)) throw new Error('无效数字')
    return n
  }
}

/** 过滤为计算器允许的字符（含全角运算符归一化）。 */
export function sanitizeArithmeticInput(raw: string): string {
  const normalized = normalizeOperators(raw)
  return normalized
    .split('')
    .filter((ch) => ALLOWED_CHAR.test(ch))
    .join('')
}

/**
 * 仅支持加减乘除、取模、幂 ^（右结合，优先于 * /）、括号与小数；不使用 eval。
 * `%` 为取模，与 `*` `/` 同级。
 */
export function evaluateArithmetic(raw: string): CalcResult {
  const normalized = normalizeOperators(raw)
  const s = stripSpaces(normalized)
  if (!s) return { ok: false, error: '请输入表达式' }
  if (!ALLOWED.test(normalized)) {
    return { ok: false, error: '仅允许数字与 + - * / % ^ ( ) 和小数点' }
  }
  try {
    const value = new Parser(s).parse()
    return { ok: true, value }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '无法计算' }
  }
}
