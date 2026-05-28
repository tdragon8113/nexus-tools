export function useDesktopAutoHide() {
  const autoHideOnBlur = useState('desktop-auto-hide-on-blur', () => true)
  const loaded = useState('desktop-auto-hide-loaded', () => false)

  async function syncFromMain() {
    if (!import.meta.client || !window.nexusDesktop?.getClipboardPrefs) {
      loaded.value = true
      return
    }
    try {
      const prefs = await window.nexusDesktop.getClipboardPrefs()
      autoHideOnBlur.value = prefs.autoHideOnBlur !== false
    } catch (err) {
      console.error('[Nexus Tools] 读取自动隐藏偏好失败', err)
    } finally {
      loaded.value = true
    }
  }

  async function setAutoHideOnBlur(next: boolean) {
    autoHideOnBlur.value = next
    if (!window.nexusDesktop?.patchClipboardPrefs) return
    try {
      const saved = await window.nexusDesktop.patchClipboardPrefs({ autoHideOnBlur: next })
      autoHideOnBlur.value = saved.autoHideOnBlur !== false
    } catch (err) {
      console.error('[Nexus Tools] 保存自动隐藏偏好失败', err)
    }
  }

  return {
    autoHideOnBlur,
    loaded,
    syncFromMain,
    setAutoHideOnBlur
  }
}
