import { searchMacApps } from '~/core/macAppSearch'
import { isElectronShell } from '~/core/desktop'
import { useMacAppIconCache } from '~/composables/useMacAppIconCache'
import type { MacAppEntry } from '~~/shared/macApps'

export function useMacApps() {
  const { prefetch: prefetchMacAppIcons } = useMacAppIconCache()
  const apps = useState<MacAppEntry[]>('desktop-mac-apps', () => [])
  const loaded = useState('desktop-mac-apps-loaded', () => false)

  async function loadMacApps(force = false) {
    if (!import.meta.client || !isElectronShell()) {
      apps.value = []
      loaded.value = true
      return
    }
    if (loaded.value && !force) return
    if (!window.nexusDesktop?.listMacApps) {
      apps.value = []
      loaded.value = true
      return
    }
    try {
      apps.value = await window.nexusDesktop.listMacApps()
    } catch (err) {
      console.error('[Nexus Tools] 读取 Mac 应用列表失败', err)
      apps.value = []
    } finally {
      loaded.value = true
      if (apps.value.length) prefetchMacAppIcons(apps.value.map((a) => a.path))
    }
  }

  function matchMacApps(query: string, limit = 5) {
    return searchMacApps(query, apps.value, limit)
  }

  async function openMacApp(app: MacAppEntry) {
    if (!window.nexusDesktop?.openMacApp) return false
    try {
      return await window.nexusDesktop.openMacApp(app.path)
    } catch (err) {
      console.error('[Nexus Tools] 打开应用失败', err)
      return false
    }
  }

  return {
    apps,
    loaded,
    loadMacApps,
    matchMacApps,
    openMacApp
  }
}
