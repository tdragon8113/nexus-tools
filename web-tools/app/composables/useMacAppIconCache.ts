import { isElectronShell } from '~/core/desktop'

const PREFETCH_CONCURRENCY = 1
const PREFETCH_MAX = 4
const PREFETCH_DEBOUNCE_MS = 250

export function useMacAppIconCache() {
  const cache = useState<Record<string, string>>('mac-app-icon-cache', () => ({}))
  const inflight = new Map<string, Promise<string | null>>()
  let prefetchTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchIcon(appPath: string): Promise<string | null> {
    if (!import.meta.client || !isElectronShell() || !appPath.endsWith('.app')) return null

    const cached = cache.value[appPath]
    if (cached) return cached

    let pending = inflight.get(appPath)
    if (!pending) {
      pending = (window.nexusDesktop?.getMacAppIcon?.(appPath) ?? Promise.resolve(null)).finally(
        () => {
          inflight.delete(appPath)
        }
      )
      inflight.set(appPath, pending)
    }

    const url = await pending
    if (url) {
      cache.value = { ...cache.value, [appPath]: url }
    }
    return url
  }

  function prefetch(appPaths: string[]) {
    if (prefetchTimer) clearTimeout(prefetchTimer)
    prefetchTimer = setTimeout(() => {
      prefetchTimer = null
      const missing = appPaths
        .slice(0, PREFETCH_MAX)
        .filter((appPath) => !cache.value[appPath] && !inflight.has(appPath))
      if (!missing.length) return

      let cursor = 0
      async function worker() {
        while (cursor < missing.length) {
          const appPath = missing[cursor]
          cursor += 1
          await fetchIcon(appPath)
        }
      }

      const workers = Math.min(PREFETCH_CONCURRENCY, missing.length)
      for (let i = 0; i < workers; i += 1) {
        void worker()
      }
    }, PREFETCH_DEBOUNCE_MS)
  }

  return { cache, fetchIcon, prefetch }
}
