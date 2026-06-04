import { isElectronShell } from '~/core/desktop'

export function useMacAppIconCache() {
  const cache = useState<Record<string, string>>('mac-app-icon-cache', () => ({}))
  const inflight = new Map<string, Promise<string | null>>()

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
    for (const appPath of appPaths) {
      if (!cache.value[appPath]) void fetchIcon(appPath)
    }
  }

  return { cache, fetchIcon, prefetch }
}
