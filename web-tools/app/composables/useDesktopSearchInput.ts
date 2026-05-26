import { triggerDesktopSearchApply } from '~/composables/desktopSearchApply'

/** 桌面搜索：剪贴板/关键词经 IPC 传入，勿写入 URL（避免超长 query 导致页面加载失败） */
export type DesktopSearchInput = {
  clipboard?: string
  q?: string
}

export function useDesktopSearchInput() {
  return useState<DesktopSearchInput | null>('desktop-search-input-pending', () => null)
}

export function stageDesktopSearchInput(input: DesktopSearchInput) {
  const clip = input.clipboard ?? ''
  const q = input.q ?? ''
  if (!clip.trim() && !q.trim()) return
  useDesktopSearchInput().value = {
    ...(clip.trim() ? { clipboard: clip } : {}),
    ...(q.trim() ? { q } : {})
  }
  triggerDesktopSearchApply()
}

/** 取出并清空待处理的 IPC 搜索输入 */
export function takeDesktopSearchInput(): DesktopSearchInput | null {
  const pending = useDesktopSearchInput().value
  if (!pending) return null
  useDesktopSearchInput().value = null
  return pending
}

/** @deprecated 使用 {@link takeDesktopSearchInput} */
export function consumeDesktopSearchInput(): string {
  const pending = takeDesktopSearchInput()
  if (!pending) return ''
  return (pending.clipboard || pending.q || '').trim()
}
