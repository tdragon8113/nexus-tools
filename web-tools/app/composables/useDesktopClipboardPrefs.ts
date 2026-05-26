import type { ClipboardPolicy } from '~/core/desktopClipboardPolicy'

export type DesktopClipboardPrefs = {
  clipboardPolicy: ClipboardPolicy
  lastAppliedClipboardHash: string
  dismissedClipboardHash: string
}

const POLICY_LABEL: Record<ClipboardPolicy, string> = {
  smart: '智能',
  always: '始终',
  never: '从不'
}

export function useDesktopClipboardPrefs() {
  const policy = useState<ClipboardPolicy>('desktop-clipboard-policy', () => 'smart')
  const lastAppliedHash = useState<string>('desktop-clipboard-last-applied', () => '')
  const dismissedHash = useState<string>('desktop-clipboard-dismissed', () => '')
  const loaded = useState('desktop-clipboard-prefs-loaded', () => false)

  async function syncFromMain() {
    if (!import.meta.client || !window.nexusDesktop?.getClipboardPrefs) {
      loaded.value = true
      return
    }
    try {
      const prefs = await window.nexusDesktop.getClipboardPrefs()
      policy.value = prefs.clipboardPolicy ?? 'smart'
      lastAppliedHash.value = prefs.lastAppliedClipboardHash ?? ''
      dismissedHash.value = prefs.dismissedClipboardHash ?? ''
    } catch (err) {
      console.error('[Nexus Tools] 读取剪贴板偏好失败', err)
    } finally {
      loaded.value = true
    }
  }

  async function patchPrefs(patch: Partial<DesktopClipboardPrefs>) {
    if (patch.clipboardPolicy) policy.value = patch.clipboardPolicy
    if (patch.lastAppliedClipboardHash !== undefined) {
      lastAppliedHash.value = patch.lastAppliedClipboardHash
    }
    if (patch.dismissedClipboardHash !== undefined) {
      dismissedHash.value = patch.dismissedClipboardHash
    }
    if (!window.nexusDesktop?.patchClipboardPrefs) return
    try {
      const next = await window.nexusDesktop.patchClipboardPrefs({
        ...(patch.clipboardPolicy ? { clipboardPolicy: patch.clipboardPolicy } : {}),
        ...(patch.lastAppliedClipboardHash !== undefined
          ? { lastAppliedClipboardHash: patch.lastAppliedClipboardHash }
          : {}),
        ...(patch.dismissedClipboardHash !== undefined
          ? { dismissedClipboardHash: patch.dismissedClipboardHash }
          : {})
      })
      policy.value = next.clipboardPolicy ?? policy.value
      lastAppliedHash.value = next.lastAppliedClipboardHash ?? ''
      dismissedHash.value = next.dismissedClipboardHash ?? ''
    } catch (err) {
      console.error('[Nexus Tools] 保存剪贴板偏好失败', err)
    }
  }

  async function setPolicy(next: ClipboardPolicy) {
    await patchPrefs({ clipboardPolicy: next })
  }

  async function markClipboardApplied(hash: string) {
    await patchPrefs({
      lastAppliedClipboardHash: hash,
      dismissedClipboardHash: ''
    })
  }

  async function dismissClipboardHash(hash: string) {
    await patchPrefs({ dismissedClipboardHash: hash })
  }

  const policyLabel = computed(() => POLICY_LABEL[policy.value])

  return {
    policy,
    policyLabel,
    lastAppliedHash,
    dismissedHash,
    loaded,
    syncFromMain,
    setPolicy,
    markClipboardApplied,
    dismissClipboardHash
  }
}
