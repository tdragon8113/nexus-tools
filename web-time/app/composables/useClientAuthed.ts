/** SSR 安全：仅在客户端 mounted 后读取 localStorage 登录态，避免 hydration 导致点击失效 */
export function useClientAuthed () {
  const mounted = ref(false)
  const authed = ref(false)

  const refresh = () => {
    authed.value = useAuthApi().isLoggedIn()
  }

  onMounted(() => {
    refresh()
    mounted.value = true
  })

  return { mounted, authed, refresh }
}
