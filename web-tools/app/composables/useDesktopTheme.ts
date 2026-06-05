import {
  DESKTOP_THEME_OPTIONS,
  isDesktopThemePreference,
  resolveDesktopTheme,
  type DesktopThemePreference,
  type DesktopThemeResolved
} from '~/core/desktopTheme'

export function useDesktopTheme() {
  const preference = useState<DesktopThemePreference>('desktop-theme-preference', () => 'system')
  const loaded = useState('desktop-theme-loaded', () => false)
  const systemPrefersDark = useState('desktop-theme-system-dark', () => false)

  const resolved = computed<DesktopThemeResolved>(() =>
    resolveDesktopTheme(preference.value, systemPrefersDark.value)
  )

  function applyThemeToDocument() {
    if (!import.meta.client) return
    document.documentElement.dataset.nexusTheme = resolved.value
    void window.nexusDesktop?.syncWindowTheme?.(resolved.value)
  }

  function bindSystemThemeListener() {
    if (!import.meta.client) return () => {}
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      systemPrefersDark.value = media.matches
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }

  async function syncFromMain() {
    if (!import.meta.client) {
      loaded.value = true
      return
    }

    systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (window.nexusDesktop?.getClipboardPrefs) {
      try {
        const prefs = await window.nexusDesktop.getClipboardPrefs()
        if (isDesktopThemePreference(prefs.theme)) {
          preference.value = prefs.theme
        }
      } catch (err) {
        console.error('[Nexus Tools] 读取主题偏好失败', err)
      }
    }

    loaded.value = true
    applyThemeToDocument()
  }

  async function setPreference(next: DesktopThemePreference) {
    preference.value = next
    applyThemeToDocument()

    if (!window.nexusDesktop?.patchClipboardPrefs) return
    try {
      const prefs = await window.nexusDesktop.patchClipboardPrefs({ theme: next })
      if (isDesktopThemePreference(prefs.theme)) {
        preference.value = prefs.theme
      }
    } catch (err) {
      console.error('[Nexus Tools] 保存主题偏好失败', err)
    }
  }

  watch(resolved, applyThemeToDocument)

  return {
    preference,
    resolved,
    loaded,
    themeOptions: DESKTOP_THEME_OPTIONS,
    syncFromMain,
    setPreference,
    bindSystemThemeListener,
    applyThemeToDocument
  }
}
