const ROUTE_TITLES: Record<string, string> = {
  '/manage/time': '浏览',
  '/manage/time/stats': '统计',
  '/profile': '我的',
  '/auth/login': '登录',
  '/auth/register': '注册'
}

export function usePageTitle () {
  const route = useRoute()
  return computed(() => ROUTE_TITLES[route.path] ?? 'Nexus Time')
}
