const DEFAULT_SYMBOLS = '!@#$%^&*-_=+[]{}:,.?/~'

export interface RandomPasswordOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
  /** 排除易混淆：0 O 1 l I */
  excludeAmbiguous: boolean
  /** 符号池；开启 symbols 时使用 */
  symbolSet?: string
}

function upperPool(exclude: boolean): string {
  return exclude ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
}

function lowerPool(exclude: boolean): string {
  return exclude ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
}

function digitPool(exclude: boolean): string {
  return exclude ? '23456789' : '0123456789'
}

/** 合并全部允许字符（用于填充剩余位数） */
export function buildFullCharset(opts: RandomPasswordOptions): string {
  let s = ''
  if (opts.upper) s += upperPool(opts.excludeAmbiguous)
  if (opts.lower) s += lowerPool(opts.excludeAmbiguous)
  if (opts.digits) s += digitPool(opts.excludeAmbiguous)
  if (opts.symbols) s += opts.symbolSet?.trim() || DEFAULT_SYMBOLS
  return s
}

/** 在 [0, max) 上均匀随机整数（拒绝采样，减轻取模偏差） */
export function secureRandomBelow(max: number): number {
  if (max <= 0) throw new RangeError('max 必须为正')
  if (max === 1) return 0
  const buf = new Uint32Array(1)
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % max)
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]!
  } while (x >= limit)
  return x % max
}

function pickFrom(pool: string): string {
  if (!pool.length) throw new Error('字符池为空')
  return pool[secureRandomBelow(pool.length)]!
}

function shuffleInPlace(chars: string[]): void {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomBelow(i + 1)
    const t = chars[i]!
    chars[i] = chars[j]!
    chars[j] = t
  }
}

/**
 * 生成随机密码：已选字符集各至少出现 1 次（长度不足时抛错）。
 * 使用 crypto.getRandomValues。
 */
export function generateRandomPassword(opts: RandomPasswordOptions): string {
  const full = buildFullCharset(opts)
  if (!full.length) {
    throw new Error('请至少选择一种字符类型')
  }

  const len = Math.floor(Number(opts.length))
  if (!Number.isFinite(len) || len < 1 || len > 256) {
    throw new Error('长度应在 1–256 之间')
  }

  const categories: string[] = []
  if (opts.upper) categories.push(upperPool(opts.excludeAmbiguous))
  if (opts.lower) categories.push(lowerPool(opts.excludeAmbiguous))
  if (opts.digits) categories.push(digitPool(opts.excludeAmbiguous))
  if (opts.symbols) categories.push(opts.symbolSet?.trim() || DEFAULT_SYMBOLS)

  if (categories.some(c => !c.length)) {
    throw new Error('符号集为空，请检查自定义符号')
  }

  if (len < categories.length) {
    throw new Error(`长度至少为 ${categories.length}，以便每种已选类型各出现一次`)
  }

  const out: string[] = []
  for (let i = 0; i < categories.length; i++) {
    out.push(pickFrom(categories[i]!))
  }
  for (let i = categories.length; i < len; i++) {
    out.push(pickFrom(full))
  }
  shuffleInPlace(out)
  return out.join('')
}
