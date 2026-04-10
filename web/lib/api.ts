const API_BASE_URL = process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export const useApi = () => {
  const token = useCookie('token')

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

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
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