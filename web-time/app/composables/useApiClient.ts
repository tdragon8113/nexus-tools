export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface User {
  id: number
  username: string
  email: string
  nickname: string | null
  avatarUrl: string | null
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  user?: User
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nexus_access_token',
  REFRESH_TOKEN: 'nexus_refresh_token',
  USER_ID: 'nexus_user_id',
  USER: 'nexus_user'
} as const

function apiBaseUrl () {
  return (useRuntimeConfig().public.apiBase as string | undefined) ?? 'http://localhost:8080'
}

function getStorageItem<T> (key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  const item = localStorage.getItem(key)
  if (!item) return defaultValue
  try {
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T> (key: string, value: T | null) {
  if (typeof window === 'undefined') return
  if (value === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function useApiClient () {
  const user = useState<User | null>('user', () => null)

  const getAccessToken = () => getStorageItem<string | null>(STORAGE_KEYS.ACCESS_TOKEN, null)
  const getRefreshToken = () => getStorageItem<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null)
  const getUserId = () => getStorageItem<number | null>(STORAGE_KEYS.USER_ID, null)

  const setAccessToken = (token: string | null) => setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token)
  const setRefreshToken = (token: string | null) => setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  const setUserId = (id: number | null) => setStorageItem(STORAGE_KEYS.USER_ID, id)

  const clearAuth = () => {
    setAccessToken(null)
    setRefreshToken(null)
    setUserId(null)
    user.value = null
    setStorageItem(STORAGE_KEYS.USER, null)
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      const result: ApiResponse<TokenResponse> = await response.json()
      if (result.code === 200 && result.data?.accessToken) {
        setAccessToken(result.data.accessToken)
        return true
      }
    } catch (e) {
      console.error('[Auth] Refresh token failed:', e)
    }

    clearAuth()
    await navigateTo('/auth/login')
    return false
  }

  const request = async <T> (path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    }

    const accessToken = getAccessToken()
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    let response: Response
    try {
      response = await fetch(`${apiBaseUrl()}${path}`, {
        ...options,
        headers
      })
    } catch {
      return { code: 0, message: '无法连接服务器，请确认后端已启动', data: null as T }
    }

    if (!response.ok && response.status !== 401) {
      return {
        code: response.status,
        message: `请求失败 (${response.status})`,
        data: null as T
      }
    }

    if (response.status === 401 && getRefreshToken() && !path.includes('/auth/refresh')) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        headers.Authorization = `Bearer ${getAccessToken()}`
        let retryResponse: Response
        try {
          retryResponse = await fetch(`${apiBaseUrl()}${path}`, { ...options, headers })
        } catch {
          return { code: 0, message: '无法连接服务器，请确认后端已启动', data: null as T }
        }
        try {
          return await retryResponse.json()
        } catch {
          return { code: 500, message: '服务响应异常', data: null as T }
        }
      }
      return { code: 401, message: 'Token expired', data: null as T }
    }

    try {
      return await response.json()
    } catch {
      return { code: 500, message: '服务响应异常', data: null as T }
    }
  }

  const initUser = () => {
    const storedUser = getStorageItem<User | null>(STORAGE_KEYS.USER, null)
    if (storedUser) {
      user.value = storedUser
      if (storedUser.id != null && getUserId() == null) {
        setUserId(storedUser.id)
      }
    }
  }

  if (typeof window !== 'undefined') {
    initUser()
  }

  return {
    request,
    user,
    getAccessToken,
    getRefreshToken,
    getUserId,
    setAccessToken,
    setRefreshToken,
    setUserId,
    clearAuth,
    refreshAccessToken,
    initUser
  }
}
