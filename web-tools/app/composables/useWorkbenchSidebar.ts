const STORAGE_KEY = 'nexus-tools-workbench-sidebar-collapsed'

export function useWorkbenchSidebar() {
  const collapsed = useState('workbench-sidebar-collapsed', () => false)
  const hydrated = useState('workbench-sidebar-hydrated', () => false)

  const restore = () => {
    if (!import.meta.client || hydrated.value) return
    hydrated.value = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === '1' || raw === 'true') collapsed.value = true
    } catch {
      /* ignore */
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
  }

  const toggle = () => {
    collapsed.value = !collapsed.value
    persist()
  }

  if (import.meta.client) {
    onMounted(restore)
  }

  return { collapsed, toggle }
}
