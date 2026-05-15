const API_BASE_URL = () =>
  (useRuntimeConfig().public.apiBase as string | undefined) ?? 'http://localhost:8080'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Habit {
  id: number
  name: string
  icon: string
  target: string
  customDays: number | null
  createdAt: string
  updatedAt: string | null
  streakDays: number
  recentCheckins: string[]
}

export interface Checkin {
  id: number
  habitId: number
  checkinDate: string
  checked: boolean
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

export function useHabitsApi() {
  const api = useApiRequest()

  const list = async () => {
    const res = await api.get<Habit[]>('/api/v1/habits')
    return res.code === 200 ? res.data : []
  }

  const create = async (data: { name: string; icon?: string; target?: string; customDays?: number }) => {
    const res = await api.post<Habit>('/api/v1/habits', data)
    return res.code === 200 ? res.data : null
  }

  const update = async (id: number, data: { name: string; icon?: string; target?: string; customDays?: number }) => {
    const res = await api.put<Habit>(`/api/v1/habits/${id}`, data)
    return res.code === 200 ? res.data : null
  }

  const deleteHabit = async (id: number) => {
    const res = await api.delete<void>(`/api/v1/habits/${id}`)
    return res.code === 200
  }

  const checkin = async (id: number) => {
    const res = await api.post<Checkin>(`/api/v1/habits/${id}/checkin`)
    return res.code === 200 ? res.data : null
  }

  const getCheckins = async (id: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const res = await api.get<Checkin[]>(`/api/v1/habits/${id}/checkins?${params}`)
    return res.code === 200 ? res.data : []
  }

  return { list, create, update, deleteHabit, checkin, getCheckins }
}