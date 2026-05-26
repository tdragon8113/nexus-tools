export type Base64DecodeErrorCode =
  | 'empty'
  | 'invalid_length'
  | 'invalid'
  | 'not_image'
  | 'too_large'

/** 图片预览体积上限（约 10MB） */
export const BASE64_IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** 桌面搜索 / IPC 可传递的 Base64 文本上限（字符数，与 {@link BASE64_IMAGE_MAX_BYTES} 对齐） */
export const MAX_CLIPBOARD_TEXT_CHARS = Math.ceil((BASE64_IMAGE_MAX_BYTES * 4) / 3) + 512

export class Base64DecodeError extends Error {
  readonly code: Base64DecodeErrorCode

  constructor(code: Base64DecodeErrorCode) {
    super(code)
    this.name = 'Base64DecodeError'
    this.code = code
  }
}

/** 去掉粘贴时常见的首尾双引号（如从 JSON / 代码里复制的字符串） */
export function stripWrappingDoubleQuotes(raw: string): string {
  let t = raw.trim()
  while (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    t = t.slice(1, -1).trim()
  }
  return t
}

/** 规范化粘贴内容：去空白、首尾引号、Data URI 前缀、URL-safe 字母表、补 padding */
export function normalizeBase64Input(raw: string): string {
  let t = stripWrappingDoubleQuotes(raw)
  if (!t) throw new Base64DecodeError('empty')

  const dataUri = /^data:[^,]*,(.+)$/i.exec(t)
  if (dataUri) {
    t = dataUri[1].trim()
  }

  t = t.replace(/\s/g, '')
  if (!t) throw new Base64DecodeError('empty')

  if (/[-_]/.test(t)) {
    t = t.replace(/-/g, '+').replace(/_/g, '/')
  }

  const remainder = t.length % 4
  if (remainder === 1) throw new Base64DecodeError('invalid_length')
  if (remainder === 2) t += '=='
  else if (remainder === 3) t += '='

  return t
}

/** 二进制 → Base64 字符串 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function buildImageDataUri(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`
}

export type ImageBase64OutputFormat = 'raw' | 'data-uri'

export interface EncodedImageBase64 {
  base64: string
  mime: string
  byteLength: number
  /** 根据 format 生成的最终字符串（纯 Base64 或 Data URI） */
  output: string
}

/** Base64（UTF-8 安全），纯浏览器 API */
export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

/** 读取图片文件为字节（超过 {@link BASE64_IMAGE_MAX_BYTES} 时抛出） */
export async function readImageFileAsBytes(file: File): Promise<Uint8Array> {
  if (!file.type.startsWith('image/')) {
    throw new Base64DecodeError('not_image')
  }
  if (file.size > BASE64_IMAGE_MAX_BYTES) {
    throw new Base64DecodeError('too_large')
  }
  return new Uint8Array(await file.arrayBuffer())
}

/** 将图片文件编码为 Base64 或 Data URI */
export async function encodeImageFileToBase64(
  file: File,
  format: ImageBase64OutputFormat = 'data-uri'
): Promise<EncodedImageBase64> {
  const bytes = await readImageFileAsBytes(file)
  const mime = file.type || sniffImageMime(bytes)
  if (!mime?.startsWith('image/')) {
    throw new Base64DecodeError('not_image')
  }
  const base64 = bytesToBase64(bytes)
  const output =
    format === 'data-uri' ? buildImageDataUri(mime, base64) : base64
  return { base64, mime, byteLength: bytes.length, output }
}

function parseImageMimeFromDataUri(raw: string): string | null {
  const t = raw.trim()
  const match = /^data:([^,]*),/i.exec(t)
  if (!match) return null
  const mimePart = match[1].split(';')[0]?.trim().toLowerCase()
  return mimePart?.startsWith('image/') ? mimePart : null
}

export function decodeBase64ToBytes(b64: string): Uint8Array {
  const normalized = normalizeBase64Input(b64)
  let binary: string
  try {
    binary = atob(normalized)
  } catch {
    throw new Base64DecodeError('invalid')
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** 根据文件头推断图片 MIME */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp'
  }

  const head = new TextDecoder()
    .decode(bytes.subarray(0, Math.min(512, bytes.length)))
    .trimStart()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'image/svg+xml'
  }

  return null
}

export function imageMimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico'
  }
  return map[mime] ?? 'bin'
}

export interface DecodedBase64Image {
  mime: string
  byteLength: number
  bytes: Uint8Array
}

/** 将 Base64（或 Data URI）解码为图片二进制 */
export function decodeBase64ToImage(raw: string): DecodedBase64Image {
  const trimmed = raw.trim()
  const mimeFromUri = parseImageMimeFromDataUri(trimmed)

  const bytes = decodeBase64ToBytes(trimmed)
  if (bytes.length > BASE64_IMAGE_MAX_BYTES) {
    throw new Base64DecodeError('too_large')
  }

  const mime = mimeFromUri ?? sniffImageMime(bytes)
  if (!mime) {
    throw new Base64DecodeError('not_image')
  }

  return { mime, byteLength: bytes.length, bytes }
}

export function base64ToUtf8(b64: string): string {
  const bytes = decodeBase64ToBytes(b64)
  return new TextDecoder().decode(bytes)
}

/** 输入是否可解码为图片（用于自动预览，失败时静默返回 false） */
export function tryDecodeBase64Image(
  raw: string
): DecodedBase64Image | null {
  const t = stripWrappingDoubleQuotes(raw)
  if (!t) return null
  if (/^data:image\//i.test(t)) {
    try {
      return decodeBase64ToImage(t)
    } catch {
      return null
    }
  }
  const compact = t.replace(/\s/g, '')
  if (compact.length < 32) return null
  if (compact.length > Math.ceil((BASE64_IMAGE_MAX_BYTES * 4) / 3)) {
    return null
  }
  try {
    return decodeBase64ToImage(t)
  } catch (e) {
    if (e instanceof Base64DecodeError && e.code === 'too_large') {
      throw e
    }
    return null
  }
}
