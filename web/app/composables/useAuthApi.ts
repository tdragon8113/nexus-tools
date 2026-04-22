const API_BASE_URL = () =>
  (useRuntimeConfig().public.apiBase as string | undefined) ?? 'http://localhost:8080'

interface ApiResponse<T> {
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

// localStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nexus_access_token',
  REFRESH_TOKEN: 'nexus_refresh_token',
  USER_ID: 'nexus_user_id',
  USER: 'nexus_user'
}

// Client-side storage helpers
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

function setStorageItem<T> (key: string, value: T | null) {
  if (typeof window === 'undefined') return
  if (value === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

function useApiRequest () {
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
  }

  const refreshAccessToken = async (): boolean => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${API_BASE_URL()}/api/v1/auth/refresh`, {
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
    navigateTo('/auth/login')
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

    const response = await fetch(`${API_BASE_URL()}${path}`, {
      ...options,
      headers
    })

    // 401 时尝试刷新 Token
    if (response.status === 401 && getRefreshToken() && !path.includes('/auth/refresh')) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        headers.Authorization = `Bearer ${getAccessToken()}`
        const retryResponse = await fetch(`${API_BASE_URL()}${path}`, { ...options, headers })
        return retryResponse.json()
      }
      return { code: 401, message: 'Token expired', data: null as T }
    }

    return response.json()
  }

  // 初始化时从 localStorage 加载用户数据
  const initUser = () => {
    const storedUser = getStorageItem<User | null>(STORAGE_KEYS.USER, null)
    if (storedUser) {
      user.value = storedUser
    }
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

export function useAuthApi () {
  const {
    request,
    user,
    getAccessToken,
    getRefreshToken,
    getUserId,
    setAccessToken,
    setRefreshToken,
    setUserId,
    clearAuth,
    initUser
  } = useApiRequest()

  // 客户端初始化
  if (typeof window !== 'undefined') {
    initUser()
  }

  const login = async (username: string, password: string) => {
    const response = await request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    console.log('[Auth] Login response:', response)
    if (response.code === 200 && response.data) {
      setAccessToken(response.data.accessToken)
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken)
      }
      if (response.data.user) {
        user.value = response.data.user
        setUserId(response.data.user.id)
        setStorageItem(STORAGE_KEYS.USER, response.data.user)
      }
      console.log('[Auth] Token stored, userId:', getUserId())
    }
    return response
  }

  const register = async (username: string, email: string, password: string) => {
    return request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    })
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await request<void>('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      })
    }
    clearAuth()
  }

  const getCurrentUser = async () => {
    console.log('[Auth] GetCurrentUser - accessToken:', getAccessToken())
    const response = await request<User>('/api/v1/auth/me')
    console.log('[Auth] GetCurrentUser response:', response)
    if (response.code === 200 && response.data) {
      user.value = response.data
      setUserId(response.data.id)
      setStorageItem(STORAGE_KEYS.USER, response.data)
    }
    return response
  }

  const deleteAccount = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await request<void>('/api/v1/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ refreshToken })
      })
    }
    clearAuth()
  }

  const isLoggedIn = () => {
    return !!getAccessToken() && !!getUserId()
  }

  return {
    login,
    register,
    logout,
    getCurrentUser,
    deleteAccount,
    user,
    isLoggedIn,
    getUserId,
    getAccessToken
  }
}