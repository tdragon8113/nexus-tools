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

function useApiRequest () {
  const accessToken = useState<string | null>('accessToken', () => null)
  const refreshToken = useCookie('refreshToken')
  const user = useState<User | null>('user', () => null)

  const refreshAccessToken = async (): boolean => {
    if (!refreshToken.value) return false

    try {
      const response = await fetch(`${API_BASE_URL()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })

      const result: ApiResponse<TokenResponse> = await response.json()
      if (result.code === 200 && result.data?.accessToken) {
        accessToken.value = result.data.accessToken
        return true
      }
    } catch (e) {
      console.error('[Auth] Refresh token failed:', e)
    }

    // Refresh Token 失效，清除状态并跳转登录页
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    navigateTo('/auth/login')
    return false
  }

  const request = async <T> (path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    }

    if (accessToken.value) {
      headers.Authorization = `Bearer ${accessToken.value}`
    }

    const response = await fetch(`${API_BASE_URL()}${path}`, {
      ...options,
      headers
    })

    // 401 时尝试刷新 Token
    if (response.status === 401 && refreshToken.value && !path.includes('/auth/refresh')) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // 重试请求
        headers.Authorization = `Bearer ${accessToken.value}`
        const retryResponse = await fetch(`${API_BASE_URL()}${path}`, { ...options, headers })
        return retryResponse.json()
      }
      return { code: 401, message: 'Token expired', data: null as T }
    }

    return response.json()
  }

  return { request, accessToken, refreshToken, user, refreshAccessToken }
}

export function useAuthApi () {
  const { request, accessToken, refreshToken, user } = useApiRequest()

  const login = async (username: string, password: string) => {
    const response = await request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    console.log('[Auth] Login response:', response)
    if (response.code === 200 && response.data) {
      accessToken.value = response.data.accessToken
      if (response.data.refreshToken) {
        refreshToken.value = response.data.refreshToken
      }
      if (response.data.user) {
        user.value = response.data.user
      }
      console.log('[Auth] Token stored, userId:', user.value?.id)
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
    if (refreshToken.value) {
      await request<void>('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })
    }
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  const getCurrentUser = async () => {
    console.log('[Auth] GetCurrentUser - accessToken:', accessToken.value)
    const response = await request<User>('/api/v1/auth/me')
    console.log('[Auth] GetCurrentUser response:', response)
    if (response.code === 200 && response.data) {
      user.value = response.data
    }
    return response
  }

  const deleteAccount = async () => {
    if (refreshToken.value) {
      await request<void>('/api/v1/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })
    }
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  return { login, register, logout, getCurrentUser, deleteAccount, user, accessToken }
}