import {
  setStorageItem,
  STORAGE_KEYS,
  useApiClient,
  type TokenResponse,
  type User
} from './useApiClient'

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
    clearAuth
  } = useApiClient()

  const login = async (username: string, password: string) => {
    const response = await request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    if (response.code === 200 && response.data) {
      setAccessToken(response.data.accessToken)
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken)
      }
      const u = response.data.user
      if (u) {
        user.value = u
        setUserId(u.id)
        setStorageItem(STORAGE_KEYS.USER, u)
      }
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
    const response = await request<User>('/api/v1/auth/me')
    if (response.code === 200 && response.data) {
      user.value = response.data
      setUserId(response.data.id)
      setStorageItem(STORAGE_KEYS.USER, response.data)
    }
    return response
  }

  const updateProfile = async (nickname: string) => {
    const response = await request<User>('/api/v1/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ nickname })
    })
    if (response.code === 200 && response.data) {
      user.value = response.data
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

  const isLoggedIn = () => !!getAccessToken()

  return {
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    deleteAccount,
    user,
    isLoggedIn,
    getUserId,
    getAccessToken
  }
}
