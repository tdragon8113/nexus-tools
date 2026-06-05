const KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Esc',
  Enter: 'Enter',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Tab: 'Tab',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  Backslash: '\\'
}

export function keyboardEventToAccelerator(event: KeyboardEvent): string | null {
  if (event.repeat) return null
  if (event.key === 'Meta' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Shift') {
    return null
  }

  const parts: string[] = []
  if (event.metaKey) parts.push('Command')
  if (event.ctrlKey) parts.push('Control')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  let key = event.key
  if (key.length === 1) {
    key = key.toUpperCase()
  } else {
    key = KEY_ALIASES[key] ?? key
  }

  if (!key || parts.length === 0) return null
  parts.push(key)
  return parts.join('+')
}

export function formatAcceleratorLabel(accelerator: string): string {
  return accelerator
    .replace(/CommandOrControl/g, '⌘')
    .replace(/Command/g, '⌘')
    .replace(/Control/g, '⌃')
    .replace(/Alt/g, '⌥')
    .replace(/Shift/g, '⇧')
    .replace(/\+/g, '')
    .replace(/Space/g, 'Space')
}

export function totpShortcutErrorMessage(error: string | undefined): string {
  switch (error) {
    case 'invalid':
      return '快捷键无效，请使用组合键（如 ⌘⇧1）'
    case 'register_failed':
      return '无法注册该快捷键，可能已被其他应用占用'
    case 'shortcut_in_use':
      return '该快捷键已被其他账户使用'
    case 'reserved':
      return '该快捷键已被应用保留'
    case 'account_not_found':
      return '账户尚未同步到桌面端，请重新打开 2FA 页面后再试'
    default:
      return '设置快捷键失败'
  }
}
