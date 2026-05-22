import { DESKTOP_ROUTES, desktopQuery, DESKTOP_QUERY_VALUE } from '~/core/desktop'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/desktop/launcher') {
    return navigateTo({
      path: DESKTOP_ROUTES.search,
      query: desktopQuery()
    })
  }

  if (to.query.desktop !== DESKTOP_QUERY_VALUE) return

  if (to.path.startsWith('/desktop') || to.path.startsWith('/tools/')) {
    setPageLayout('desktop')
  }
})
