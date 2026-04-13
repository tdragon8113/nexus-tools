const API_BASE_URL = process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080'

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

export const useApi = () => {
  const token = useCookie('token')
  const userId = useCookie('userId')

  const request = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token.value) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token.value}`
    }

    if (userId.value) {
      (headers as Record<string, string>)['X-User-Id'] = String(userId.value)
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include' // 保存 session cookie
    })

    return response.json()
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
  }
}

export const useAuthApi = () => {
  const api = useApi()
  const token = useCookie('token')
  const userId = useCookie('userId')
  const user = useState<User | null>('user', () => null)

  const login = async (username: string, password: string) => {
    const response = await api.post<User>('/api/v1/auth/login', { username, password })
    if (response.code === 200 && response.data) {
      user.value = response.data
      userId.value = String(response.data.id)
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
    const response = await api.get<User>('/api/v1/auth/me')
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