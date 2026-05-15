import { showToast } from 'vant'

export async function copyWithToast(text: string, okMessage = '已复制'): Promise<boolean> {
  if (!import.meta.client) return false
  try {
    await navigator.clipboard.writeText(text)
    showToast(okMessage)
    return true
  } catch {
    showToast('复制失败')
    return false
  }
}
