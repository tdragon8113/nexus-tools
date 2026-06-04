import type { TotpAccessibilityStatus } from '~/composables/useTotpDesktopAutofill'

export function useTotpAccessibility() {
  const { supported, getAccessibilityStatus, requestAccessibilityPermission, openAccessibilitySettingsOnly } =
    useTotpDesktopAutofill()

  const loaded = ref(false)
  const trusted = ref(true)
  const required = ref(false)
  const appName = ref('Nexus Tools')
  const hint = ref('')
  const launchHost = ref<string | null>(null)
  const isDev = ref(false)
  const requesting = ref(false)

  function applyStatus(status: TotpAccessibilityStatus) {
    trusted.value = status.trusted
    required.value = status.required
    appName.value = status.appName
    hint.value = status.hint
    launchHost.value = status.launchHost ?? null
    isDev.value = status.isDev
  }

  async function refresh() {
    if (!supported.value) {
      loaded.value = true
      required.value = false
      trusted.value = true
      return
    }
    try {
      const status = await getAccessibilityStatus()
      applyStatus(status)
      return status
    } catch (err) {
      console.error('[Nexus Tools] 读取辅助功能状态失败', err)
    } finally {
      loaded.value = true
    }
  }

  async function authorize() {
    if (requesting.value || !supported.value) return
    requesting.value = true
    try {
      const result = await requestAccessibilityPermission()
      applyStatus(result)
      return result
    } finally {
      requesting.value = false
    }
  }

  function bindWindowFocusRefresh(active: () => boolean) {
    const onFocus = () => {
      if (!active()) return
      void refresh()
    }
    onMounted(() => {
      window.addEventListener('focus', onFocus)
    })
    onUnmounted(() => {
      window.removeEventListener('focus', onFocus)
    })
  }

  async function openSettings() {
    if (!supported.value) return
    const status = await openAccessibilitySettingsOnly()
    applyStatus(status)
    return status
  }

  return {
    supported,
    loaded,
    trusted,
    required,
    appName,
    hint,
    launchHost,
    isDev,
    requesting,
    refresh,
    authorize,
    openSettings,
    bindWindowFocusRefresh
  }
}
