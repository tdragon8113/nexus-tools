import { DESKTOP_ROUTES } from '~/core/desktop'

/** 桌面应用：统一壳布局，废弃网页版 /tools 与根路径 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/' || to.path === '/desktop/launcher') {
    return navigateTo({ path: DESKTOP_ROUTES.search })
  }

  if (to.path === '/tools' || to.path === '/desktop/hub') {
    return navigateTo({ path: DESKTOP_ROUTES.search })
  }

  setPageLayout('desktop')
})
