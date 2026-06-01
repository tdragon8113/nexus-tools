/** 全局登录态：与 localStorage token 同步，供各页回显与拉取云端记录 */
export function useAuthSession () {
  const { getAccessToken, initUser, user, clearAuth } = useApiClient()
  const mounted = useState('auth-session-mounted', () => false)
  const authed = useState('auth-session-logged-in', () => false)

  function sync () {
    if (import.meta.server) return
    const hasToken = !!getAccessToken()
    authed.value = hasToken
    if (hasToken) {
      initUser()
    } else {
      user.value = null
    }
  }

  function markLoggedIn () {
    authed.value = true
    initUser()
  }

  function markLoggedOut () {
    clearAuth()
    authed.value = false
    if (import.meta.client) {
      useActivities().invalidate()
    }
  }

  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      sync()
      mounted.value = true
    })
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
