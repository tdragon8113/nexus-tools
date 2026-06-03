/** 全局登录态：与 localStorage token 同步，供各页回显与拉取云端记录 */
export function useAuthSession () {
  const { getAccessToken, initUser, user, clearAuth } = useApiClient()
  const mounted = useState('auth-session-mounted', () => false)
  const authed = useState('auth-session-logged-in', () => false)

  function sync () {
    if (import.meta.server) return
    mounted.value = true
    const hasToken = !!getAccessToken()
    authed.value = hasToken
    if (hasToken) {
      initUser()
    } else {
      user.value = null
    }
  }

  function markLoggedIn () {
    mounted.value = true
    authed.value = true
    initUser()
  }

  function markLoggedOut () {
    clearAuth()
    authed.value = false
    if (import.meta.client) {
      useActivities().invalidate()
      useLifeCards().invalidate()
    }
  }

  if (import.meta.client && getCurrentInstance()) {
    onMounted(sync)
  }

  return {
    mounted,
    authed,
    user,
    sync,
    markLoggedIn,
    markLoggedOut
  }
}
