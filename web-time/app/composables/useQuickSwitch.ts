export type SegmentSheetMode = 'start' | 'switch'

/** 开始 / 快切共用的 Bottom Sheet 显隐与模式 */
export function useQuickSwitch () {
  const open = useState('quick-switch-open', () => false)
  const mode = useState<SegmentSheetMode>('quick-switch-mode', () => 'start')

  function openSheet (forcedMode?: SegmentSheetMode) {
    if (forcedMode) {
      mode.value = forcedMode
    } else {
      const { hasSession } = useActiveSession()
      mode.value = hasSession.value ? 'switch' : 'start'
    }
    open.value = true
  }

  function closeSheet () {
    open.value = false
  }

  return { open, mode, openSheet, closeSheet }
}
