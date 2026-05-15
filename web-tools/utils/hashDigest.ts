import SparkMD5 from 'spark-md5'

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

function hexFromBuffer(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

const WEB_ALGO: Record<Exclude<HashAlgorithm, 'MD5'>, AlgorithmIdentifier> = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512'
}

export async function digestText(algorithm: HashAlgorithm, text: string): Promise<string> {
  if (algorithm === 'MD5') {
    return SparkMD5.hash(text)
  }
  const enc = new TextEncoder().encode(text)
  const subtle = typeof crypto !== 'undefined' && crypto.subtle
  if (!subtle) throw new Error('当前环境不支持 Web Crypto')
  const buf = await subtle.digest(WEB_ALGO[algorithm], enc)
  return hexFromBuffer(buf)
}
