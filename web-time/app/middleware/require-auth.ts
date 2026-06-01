/** 需登录的路由：未登录则跳转登录页 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { authed, sync } = useAuthSession()
  sync()

  if (!authed.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
