/** 桌面搜索：剪贴板/关键词经 IPC 传入，勿写入 URL（避免超长 query 导致页面加载失败） */
export type DesktopSearchInput = {
  clipboard?: string
  q?: string
}

export function useDesktopSearchInput() {
  return useState<DesktopSearchInput | null>('desktop-search-input-pending', () => null)
}

export function stageDesktopSearchInput(input: DesktopSearchInput) {
  const clip = input.clipboard?.trim() ?? ''
  const q = input.q?.trim() ?? ''
  if (!clip && !q) return
  useDesktopSearchInput().value = {
    ...(clip ? { clipboard: clip } : {}),
    ...(q ? { q } : {})
  }
}

export function consumeDesktopSearchInput(): string {
  const pending = useDesktopSearchInput().value
  if (!pending) return ''
  useDesktopSearchInput().value = null
  return (pending.q || pending.clipboard || '').trim()
}
