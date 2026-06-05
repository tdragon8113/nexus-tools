import { showToast } from 'vant'
import type { NexusUpdateState } from '~/types/nexus-desktop'

const defaultState = (): NexusUpdateState => ({
  status: 'idle',
  currentVersion: '0.0.0'
})

function friendlyUpdateError(message: string): string {
  if (message === 'Please check update first') {
    return '更新检查未完成，请稍后再试或打开下载页'
  }
  if (message === '开发模式不支持检查更新') {
    return message
  }
  if (message.startsWith('GitHub API')) {
    return '无法连接 GitHub，请检查网络后重试'
  }
  if (/code signature/i.test(message)) {
    return 'macOS 未签名，请从下载页手动安装 DMG'
  }
  return message
}

export function useDesktopUpdater() {
  const updateState = useState<NexusUpdateState>('desktop-update-state', defaultState)
  const autoUpdateEnabled = useState('desktop-auto-update-enabled', () => true)
  const loaded = useState('desktop-updater-loaded', () => false)
  const checking = computed(() => updateState.value.status === 'checking')
  const downloading = computed(() => updateState.value.status === 'downloading')

  function applyState(state: NexusUpdateState) {
    updateState.value = state
  }

  async function syncFromMain() {
    if (!import.meta.client || !window.nexusDesktop?.getUpdateState) {
      loaded.value = true
      return
    }
    try {
      const [state, prefs] = await Promise.all([
        window.nexusDesktop.getUpdateState(),
        window.nexusDesktop.getClipboardPrefs?.() ?? Promise.resolve({ clipboardPolicy: 'smart' as const })
      ])
      applyState(state)
      autoUpdateEnabled.value = prefs.autoUpdateEnabled !== false
    } catch (err) {
      console.error('[Nexus Tools] 读取更新状态失败', err)
    } finally {
      loaded.value = true
    }
  }

  function bindUpdateListener() {
    if (!window.nexusDesktop?.onUpdateState) return () => {}
    return window.nexusDesktop.onUpdateState((state) => {
      applyState(state)
    })
  }

  async function setAutoUpdateEnabled(next: boolean) {
    autoUpdateEnabled.value = next
    if (!window.nexusDesktop?.patchClipboardPrefs) return
    try {
      const saved = await window.nexusDesktop.patchClipboardPrefs({ autoUpdateEnabled: next })
      autoUpdateEnabled.value = saved.autoUpdateEnabled !== false
    } catch (err) {
      console.error('[Nexus Tools] 保存自动更新偏好失败', err)
    }
  }

  async function checkForUpdates() {
    if (!window.nexusDesktop?.checkForUpdates) return
    try {
      const state = await window.nexusDesktop.checkForUpdates()
      applyState(state)
      if (state.status === 'not-available' && state.error) {
        showToast(friendlyUpdateError(state.error))
      } else if (state.status === 'not-available') {
        showToast('已是最新版本')
      } else if (state.status === 'error' && state.error) {
        showToast(friendlyUpdateError(state.error))
      } else if (state.status === 'available' && state.latestVersion) {
        showToast(`发现新版本 ${state.latestVersion}`)
      }
    } catch (err) {
      showToast('检查更新失败')
      console.error(err)
    }
  }

  async function downloadUpdate() {
    if (!window.nexusDesktop?.downloadUpdate) return
    try {
      applyState(await window.nexusDesktop.downloadUpdate())
    } catch (err) {
      showToast('下载更新失败')
      console.error(err)
    }
  }

  function installUpdate() {
    window.nexusDesktop?.installUpdate?.()
  }

  function openReleasePage() {
    window.nexusDesktop?.openUpdateReleasePage?.()
  }

  const statusText = computed(() => {
    const s = updateState.value
    switch (s.status) {
      case 'idle':
        return loaded.value ? '尚未检查' : '加载中…'
      case 'checking':
        return '正在检查…'
      case 'not-available':
        return s.error ?? '已是最新版本'
      case 'available':
        return s.latestVersion ? `可更新至 ${s.latestVersion}` : '发现新版本'
      case 'downloading':
        return s.percent != null ? `下载中 ${Math.round(s.percent)}%` : '下载中…'
      case 'downloaded':
        return s.manualInstallRecommended
          ? '更新包已就绪，请打开下载页安装'
          : '已下载，可安装'
      case 'error':
        return friendlyUpdateError(s.error ?? '更新失败')
      default:
        return ''
    }
  })

  const canInstall = computed(() => updateState.value.status === 'downloaded')
  const canDownload = computed(() => updateState.value.status === 'available')
  const showManualRelease = computed(
    () =>
      updateState.value.manualInstallRecommended === true ||
      (updateState.value.status === 'error' && updateState.value.releaseUrl)
  )

  return {
    updateState,
    autoUpdateEnabled,
    loaded,
    checking,
    downloading,
    statusText,
    canInstall,
    canDownload,
    showManualRelease,
    syncFromMain,
    bindUpdateListener,
    setAutoUpdateEnabled,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openReleasePage
  }
}
