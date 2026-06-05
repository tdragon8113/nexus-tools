import { isElectronShell } from '~/core/desktop'
import {
  MANAGED_RENDERER_LOCAL_STATE_KEYS,
  type RendererLocalStateMap
} from '~~/shared/rendererLocalState'

function readLocalKey(key: string): string | null {
  if (!import.meta.client) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalKey(key: string, value: string) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota */
  }
}

/** 启动时以主进程 userData 为准，写入 localStorage；local 独有项回写主进程 */
export async function hydrateRendererLocalStateFromMain(): Promise<void> {
  if (!import.meta.client || !isElectronShell() || !window.nexusDesktop?.getRendererLocalState) {
    return
  }

  try {
    const fromMain = await window.nexusDesktop.getRendererLocalState()
    const patchToMain: RendererLocalStateMap = {}

    for (const key of MANAGED_RENDERER_LOCAL_STATE_KEYS) {
      const mainValue = fromMain[key]
      const localValue = readLocalKey(key)

      if (typeof mainValue === 'string' && mainValue.length > 0) {
        writeLocalKey(key, mainValue)
        continue
      }

      if (localValue && localValue.length > 0) {
        patchToMain[key] = localValue
        continue
      }
    }

    if (Object.keys(patchToMain).length > 0 && window.nexusDesktop.patchRendererLocalState) {
      const synced = await window.nexusDesktop.patchRendererLocalState(patchToMain)
      for (const [key, value] of Object.entries(synced)) {
        writeLocalKey(key, value)
      }
    }
  } catch (err) {
    console.error('[Nexus Tools] 同步 renderer 本地状态失败', err)
  }
}

/** 写入 localStorage，并同步到主进程 userData */
export async function persistRendererLocalStateKey(key: string, value: string): Promise<void> {
  if (!import.meta.client) return
  writeLocalKey(key, value)
  if (!isElectronShell() || !window.nexusDesktop?.patchRendererLocalState) return
  try {
    await window.nexusDesktop.patchRendererLocalState({ [key]: value })
  } catch {
    /* main process may be unavailable */
  }
}

export function persistRendererLocalStateKeyFireAndForget(key: string, value: string) {
  void persistRendererLocalStateKey(key, value)
}
