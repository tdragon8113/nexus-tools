const API_BASE_URL = () =>
  (useRuntimeConfig().public.apiBase as string | undefined) ?? 'http://localhost:8080'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Activity {
  id: number
  title: string | null
  category: string
  startTime: string
  endTime: string | null
  durationMinutes: number | null
  notes: string | null
  createdAt: string
}

export interface Stats {
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
  totalSessions: number
  hourlyDistribution: Record<string, number>
  dailyDistribution: Record<string, number>
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
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
  }
}

export function useActivityApi() {
  const api = useApiRequest()

  const create = async (data: {
    title?: string
    category?: string
    startTime: string
    endTime?: string
    durationMinutes?: number
    notes?: string
  }) => {
    const res = await api.post<Activity>('/api/v1/activities', data)
    return res.code === 200 ? res.data : null
  }

  const list = async () => {
    const res = await api.get<Activity[]>('/api/v1/activities')
    return res.code === 200 ? res.data : []
  }

  const getStats = async () => {
    const res = await api.get<Stats>('/api/v1/activities/stats')
    return res.code === 200 ? res.data : null
  }

  const deleteActivity = async (id: number) => {
    const res = await api.delete<void>(`/api/v1/activities/${id}`)
    return res.code === 200
  }

  return { create, list, getStats, deleteActivity }
}