import type { LocationQuery, RouteLocationRaw } from 'vue-router'

export const BACK_QUERY_KEY = 'back'

/** 仅允许站内相对路径，避免 open redirect */
export function isSafeBackPath (path: string) {
  return path.startsWith('/') && !path.startsWith('//')
}

export function parseBackQuery (query: LocationQuery): string | null {
  const back = query[BACK_QUERY_KEY]
  if (typeof back === 'string' && isSafeBackPath(back)) return back
  return null
}

/** 各子页在无 back 参数时的默认返回目标 */
export const BACK_FALLBACKS: Record<string, string> = {
  '/manage/time/edit': '/manage/time',
  '/manage/time/tags': '/manage/time',
  '/profile/cards': '/profile',
  '/profile/tags': '/profile'
}

export function useBackNavigation () {
  const route = useRoute()

  function resolveBack (fallback?: string) {
    return parseBackQuery(route.query)
      ?? fallback
      ?? BACK_FALLBACKS[route.path]
      ?? '/manage/time'
  }

  /** 跳转到子页，并记住当前页为返回目标 */
  function linkWithBack (path: string, extraQuery?: Record<string, string>): RouteLocationRaw {
    const query: Record<string, string> = { ...extraQuery }
    if (isSafeBackPath(route.path)) {
      query[BACK_QUERY_KEY] = route.path
    }
    return { path, query }
  }

  function navigateWithBack (path: string, extraQuery?: Record<string, string>) {
    return navigateTo(linkWithBack(path, extraQuery))
  }

  /** 保留 query.back，用于子页内切换筛选等 */
  function preserveBackQuery (extraQuery?: Record<string, string>) {
    const query: Record<string, string> = { ...extraQuery }
    const back = parseBackQuery(route.query)
    if (back) query[BACK_QUERY_KEY] = back
    return query
  }

  return {
    resolveBack,
    linkWithBack,
    navigateWithBack,
    preserveBackQuery
  }
}
