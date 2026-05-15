/** RGB 0–255 */
export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** #RGB、#RRGGBB、可选 #RRGGBBAA */
export function parseHex(hex: string): { rgb: Rgb; alpha?: number } | null {
  let h = hex.trim().replace(/^#/, '')
  if (!h) return null
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16)
    const rgb = parseHex(h.slice(0, 6))
    if (!rgb) return null
    return { rgb: rgb.rgb, alpha: a / 255 }
  }
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return {
    rgb: {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    }
  }
}

export function rgbToHex(c: Rgb): string {
  const to = (x: number) => clamp255(x).toString(16).padStart(2, '0')
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`.toUpperCase()
}

export function rgbToHsl(c: Rgb): Hsl {
  const r = clamp255(c.r) / 255
  const g = clamp255(c.g) / 255
  const b = clamp255(c.b) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360 / 360
  const S = clamp01(s / 100)
  const L = clamp01(l / 100)
  if (S === 0) {
    const v = Math.round(L * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let T = t
    if (T < 0) T += 1
    if (T > 1) T -= 1
    if (T < 1 / 6) return p + (q - p) * 6 * T
    if (T < 1 / 2) return q
    if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6
    return p
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S
  const p = 2 * L - q
  return {
    r: Math.round(hue2rgb(p, q, H + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, H) * 255),
    b: Math.round(hue2rgb(p, q, H - 1 / 3) * 255)
  }
}

export function formatRgb(c: Rgb): string {
  return `rgb(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)})`
}

export function formatHsl(h: Hsl): string {
  return `hsl(${h.h}, ${h.s}%, ${h.l}%)`
}
