import { showToast } from 'vant'

async function writeClipboard(text: string): Promise<boolean> {
  if (!import.meta.client) return false

  if (window.nexusDesktop?.writeClipboardText) {
    try {
      return (await window.nexusDesktop.writeClipboardText(text)) === true
    } catch {
      /* fall through */
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function copyWithToast(text: string, okMessage = '已复制'): Promise<boolean> {
  if (!text) return false
  const ok = await writeClipboard(text)
  if (ok) {
    showToast(okMessage)
    return true
  }
  showToast('复制失败')
  return false
}
