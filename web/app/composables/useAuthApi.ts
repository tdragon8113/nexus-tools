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

function useApiRequest () {
  const token = useCookie('token')
  const userId = useCookie('userId', { decode: (value) => value })

  const request = async <T> (path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }
    if (userId.value) {
      // 移除可能的 JSON 引号
      const rawUserId = String(userId.value).replace(/^"|"$/g, '')
      headers['X-User-Id'] = rawUserId
    }

    const response = await fetch(`${API_BASE_URL()}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    })

    return response.json()
  }

  return {
    get: <T> (path: string) => request<T>(path, { method: 'GET' }),
    post: <T> (path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T> (path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T> (path: string) => request<T>(path, { method: 'DELETE' })
  }
}

export function useAuthApi () {
  const api = useApiRequest()
  const token = useCookie('token')
  const userId = useCookie('userId')
  const user = useState<User | null>('user', () => null)

  const login = async (username: string, password: string) => {
    const response = await api.post<User>('/api/v1/auth/login', { username, password })
    console.log('[Auth] Login response:', response)
    if (response.code === 200 && response.data) {
      user.value = response.data
      userId.value = String(response.data.id)
      console.log('[Auth] UserId cookie set:', userId.value)
    }
    return response
  }

  const register = async (username: string, email: string, password: string) => {
    return api.post<User>('/api/v1/auth/register', { username, email, password })
  }

  const logout = async () => {
    await api.post<void>('/api/v1/auth/logout')
    user.value = null
    token.value = null
    userId.value = null
  }

  const getCurrentUser = async () => {
    console.log('[Auth] GetCurrentUser - userId cookie:', userId.value)
    const response = await api.get<User>('/api/v1/auth/me')
    console.log('[Auth] GetCurrentUser response:', response)
    if (response.code === 200 && response.data) {
      user.value = response.data
    }
    return response
  }

  const deleteAccount = async () => {
    await api.delete<void>('/api/v1/auth/account')
    user.value = null
    token.value = null
    userId.value = null
  }

  return { login, register, logout, getCurrentUser, deleteAccount, user }
}
