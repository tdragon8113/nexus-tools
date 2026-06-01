const ROUTE_TITLES: Record<string, string> = {
  '/manage/time': '记录',
  '/manage/time/stats': '回顾',
  '/manage/time/insights': '感悟',
  '/manage/time/edit': '写记录',
  '/manage/time/tags': '标签',
  '/profile/cards': '生活卡片',
  '/profile/tags': '记录标签',
  '/profile': '我的',
  '/auth/login': '登录',
  '/auth/register': '注册'
}

export function usePageTitle () {
  const route = useRoute()
  return computed(() => ROUTE_TITLES[route.path] ?? 'Nexus Time')
}
