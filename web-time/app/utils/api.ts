/** 生产环境 apiBase 为空字符串，走同源 /api 反代 */
export function getApiBase (): string {
  const configured = useRuntimeConfig().public.apiBase as string | undefined
  if (configured == null || configured === '') return ''
  return configured.replace(/\/$/, '')
}

export function buildApiUrl (path: string): string {
  const base = getApiBase()
  return `${base}${path}`
}

export function isAuthEndpoint (path: string): boolean {
  return path.includes('/auth/login')
    || path.includes('/auth/register')
    || path.includes('/auth/refresh')
}
