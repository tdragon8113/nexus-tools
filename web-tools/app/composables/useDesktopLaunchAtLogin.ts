export function useDesktopLaunchAtLogin() {
  const openAtLogin = useState('desktop-open-at-login', () => false)
  const loaded = useState('desktop-open-at-login-loaded', () => false)

  async function syncFromMain() {
    if (!import.meta.client || !window.nexusDesktop?.getClipboardPrefs) {
      loaded.value = true
      return
    }
    try {
      const prefs = await window.nexusDesktop.getClipboardPrefs()
      openAtLogin.value = prefs.openAtLogin === true
    } catch (err) {
      console.error('[Nexus Tools] 读取开机启动偏好失败', err)
    } finally {
      loaded.value = true
    }
  }

  async function setOpenAtLogin(next: boolean) {
    openAtLogin.value = next
    if (!window.nexusDesktop?.patchClipboardPrefs) return
    try {
      const saved = await window.nexusDesktop.patchClipboardPrefs({ openAtLogin: next })
      openAtLogin.value = saved.openAtLogin === true
    } catch (err) {
      console.error('[Nexus Tools] 保存开机启动偏好失败', err)
    }
  }

  return {
    openAtLogin,
    loaded,
    syncFromMain,
    setOpenAtLogin
  }
}
