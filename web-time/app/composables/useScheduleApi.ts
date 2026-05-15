const API_BASE_URL = () =>
  (useRuntimeConfig().public.apiBase as string | undefined) ?? 'http://localhost:8080'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Todo {
  id: number
  title: string
  description: string | null
  status: number
  priority: number
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

function useApiRequest() {
  const token = useCookie('token')
  const userId = useCookie('userId')

  const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }
    if (userId.value) {
      headers['X-User-Id'] = String(userId.value)
    }

    const response = await fetch(`${API_BASE_URL()}${path}`, {
      ...options,
      headers,
      credentials: 'include'
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

export function useScheduleApi() {
  const api = useApiRequest()

  const list = async (date?: string) => {
    const params = date ? `?date=${date}T00:00:00` : ''
    const res = await api.get<Todo[]>(`/api/v1/todos${params}`)
    return res.code === 200 ? res.data : []
  }

  const listByRange = async (startDate: string, endDate: string) => {
    const params = `?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59`
    const res = await api.get<Todo[]>(`/api/v1/todos${params}`)
    return res.code === 200 ? res.data : []
  }

  const create = async (data: { title: string; description?: string; priority?: number; dueDate?: string }) => {
    const res = await api.post<Todo>('/api/v1/todos', data)
    return res.code === 200 ? res.data : null
  }

  const update = async (id: number, data: { title: string; description?: string; status?: number; priority?: number; dueDate?: string }) => {
    const res = await api.put<Todo>(`/api/v1/todos/${id}`, data)
    return res.code === 200 ? res.data : null
  }

  const deleteTodo = async (id: number) => {
    const res = await api.delete<void>(`/api/v1/todos/${id}`)
    return res.code === 200
  }

  return { list, listByRange, create, update, deleteTodo }
}