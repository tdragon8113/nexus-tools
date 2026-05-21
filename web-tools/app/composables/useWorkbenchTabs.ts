import { siteTools } from '~~/data/siteTools'

export interface WorkbenchTab {
  id: string
  label: string
  path: string
  icon: string
}

const STORAGE_KEY = 'nexus-tools-workbench-tabs-v1'

function tabFromPath(path: string): WorkbenchTab | null {
  const tool = siteTools.find((t) => t.path === path)
  if (!tool?.path) return null
  return {
    id: tool.id,
    label: tool.name,
    path: tool.path,
    icon: tool.icon
  }
}

function normalizeTabs(tabs: WorkbenchTab[]): WorkbenchTab[] {
  const seen = new Set<string>()
  return tabs.filter((tab) => {
    if (!tab.path || seen.has(tab.path)) return false
    seen.add(tab.path)
    return Boolean(tabFromPath(tab.path))
  })
}

export function useWorkbenchTabs() {
  const route = useRoute()
  const tabs = useState<WorkbenchTab[]>('workbench-tabs', () => [])
  const restored = useState('workbench-tabs-restored', () => false)

  const activePath = computed(() => route.path)
  const activeTab = computed(() => tabs.value.find((tab) => tab.path === activePath.value) ?? null)

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs.value))
  }

  const restore = () => {
    if (!import.meta.client || restored.value) return
    restored.value = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        tabs.value = normalizeTabs(parsed)
      }
    } catch {
      tabs.value = []
    }
  }

  const openPath = (path: string) => {
    const tab = tabFromPath(path)
    if (!tab) return
    if (!tabs.value.some((item) => item.path === tab.path)) {
      tabs.value = [...tabs.value, tab]
      persist()
    }
  }

  const activatePath = async (path: string) => {
    openPath(path)
    if (route.path !== path) {
      await navigateTo(path)
    }
  }

  const closePath = async (path: string) => {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index < 0) return

    const nextTabs = tabs.value.filter((tab) => tab.path !== path)
    tabs.value = nextTabs
    persist()

    if (route.path !== path) return

    const next = nextTabs[index] ?? nextTabs[index - 1]
    await navigateTo(next?.path ?? '/')
  }

  const syncRouteTab = () => {
    openPath(route.path)
  }

  return {
    tabs,
    activePath,
    activeTab,
    restore,
    openPath,
    activatePath,
    closePath,
    syncRouteTab
  }
}
