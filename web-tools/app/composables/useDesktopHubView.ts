export type DesktopHubViewMode = 'list' | 'icons'

const STORAGE_KEY = 'nexus-desktop-hub-view'

export function useDesktopHubView() {
  const viewMode = ref<DesktopHubViewMode>('icons')

  onMounted(() => {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'list' || saved === 'icons') viewMode.value = saved
  })

  watch(viewMode, (mode) => {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, mode)
  })

  return { viewMode }
}
