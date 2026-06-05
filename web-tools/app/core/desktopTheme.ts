export type DesktopThemePreference = 'light' | 'dark' | 'system'
export type DesktopThemeResolved = 'light' | 'dark'

export const DESKTOP_THEME_OPTIONS: {
  value: DesktopThemePreference
  label: string
  hint: string
}[] = [
  { value: 'light', label: '亮色', hint: '始终使用浅色界面' },
  { value: 'dark', label: '暗色', hint: '始终使用深色界面' },
  { value: 'system', label: '跟随系统', hint: '与 macOS 外观设置保持一致' }
]

export function isDesktopThemePreference(value: unknown): value is DesktopThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveDesktopTheme(
  preference: DesktopThemePreference,
  systemPrefersDark: boolean
): DesktopThemeResolved {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}
