import type { ApiResponse } from '~/types/api'
import { buildApiUrl, isAuthEndpoint } from '~/utils/api'

let refreshInFlight: Promise<boolean> | null = null

export function isUnauthorizedResponse (status: number) {
  return status === 401
}

/** 401 且无法恢复登录态：清缓存并跳转登录页 */
export async function forceAuthLogout (redirectPath?: string) {
  const { clearAuth } = useApiClient()
  clearAuth()
  useAuthSession().markLoggedOut()
  useActivities().invalidate()

  if (!import.meta.client) return

  const path = redirectPath ?? useRoute().fullPath
  if (path.startsWith('/auth/')) return

  await navigateTo(`/auth/login?redirect=${encodeURIComponent(path)}`)
}

/** 单飞刷新 access token，避免并发 401 重复调用 refresh */
export async function refreshAccessTokenOnce (): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const { getRefreshToken, setAccessToken, setRefreshToken, clearAuth } = useApiClient()
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      let result: ApiResponse<{ accessToken?: string; refreshToken?: string }>
      try {
        result = await response.json()
      } catch {
        return false
      }

      if (response.ok && result.code === 200 && result.data?.accessToken) {
        setAccessToken(result.data.accessToken)
        if (result.data.refreshToken) {
          setRefreshToken(result.data.refreshToken)
        }
        useAuthSession().markLoggedIn()
        return true
      }
    } catch (e) {
      console.error('[Auth] Refresh token failed:', e)
    }

    clearAuth()
    useAuthSession().markLoggedOut()
    return false
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

/** access 失效时尝试 refresh；失败则强制登出 */
export async function recoverFromUnauthorized (path: string): Promise<boolean> {
  if (isAuthEndpoint(path)) return false

  if (!useApiClient().getRefreshToken()) {
    await forceAuthLogout()
    return false
  }

  const ok = await refreshAccessTokenOnce()
  if (!ok) {
    await forceAuthLogout()
  }
  return ok
}
