import { shallowRef, type ShallowRef } from 'vue'
import { triggerDesktopSearchApply } from '~/composables/desktopSearchApply'
import type { ClipboardOpenSource } from '~/core/desktopClipboardPolicy'

/** 桌面搜索：剪贴板/关键词经 IPC 传入，勿写入 URL（避免超长 query 导致页面加载失败） */
export type DesktopSearchInput = {
  clipboard?: string
  q?: string
  source?: ClipboardOpenSource
}

/**
 * 模块级 ref：IPC / watch 可能在 Nuxt setup 外触发，不能用 useState。
 */
const desktopSearchInputPending = shallowRef<DesktopSearchInput | null>(null)

export function useDesktopSearchInput(): ShallowRef<DesktopSearchInput | null> {
  return desktopSearchInputPending
}

export function stageDesktopSearchInput(input: DesktopSearchInput) {
  const clip = input.clipboard ?? ''
  const q = input.q ?? ''
  if (!clip.trim() && !q.trim()) return
  desktopSearchInputPending.value = {
    ...(clip.trim() ? { clipboard: clip } : {}),
    ...(q.trim() ? { q: q } : {}),
    ...(input.source ? { source: input.source } : {})
  }
  triggerDesktopSearchApply()
}

/** 取出并清空待处理的 IPC 搜索输入 */
export function takeDesktopSearchInput(): DesktopSearchInput | null {
  const pending = desktopSearchInputPending.value
  if (!pending) return null
  desktopSearchInputPending.value = null
  return pending
}

/** @deprecated 使用 {@link takeDesktopSearchInput} */
export function consumeDesktopSearchInput(): string {
  const pending = takeDesktopSearchInput()
  if (!pending) return ''
  return (pending.clipboard || pending.q || '').trim()
}
