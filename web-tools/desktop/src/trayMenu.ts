import { app, Menu, type MenuItemConstructorOptions } from 'electron'
import { getOpenAtLoginFromSystem } from './loginItem'
import { applyPrefsPatch, type PrefsPatchDeps } from './prefsPatch'
import type { DesktopPrefsStore } from './prefs'

export type TrayMenuActions = {
  onSearch: () => void
  onSettings: () => void
  onCheckUpdate: () => void
}

export type TrayMenuDeps = TrayMenuActions & {
  prefs: DesktopPrefsStore
  prefsPatchDeps?: PrefsPatchDeps
}

export function buildTrayContextMenu(deps: TrayMenuDeps): Menu {
  const prefs = deps.prefs.read()

  const patch = (partial: Parameters<typeof applyPrefsPatch>[1]) => {
    applyPrefsPatch(deps.prefs, partial, deps.prefsPatchDeps)
  }

  const template: MenuItemConstructorOptions[] = [
    { label: '搜索', click: () => deps.onSearch() },
    { type: 'separator' },
    {
      label: '失焦时自动隐藏',
      type: 'checkbox',
      checked: prefs.autoHideOnBlur !== false,
      click: (item) => patch({ autoHideOnBlur: item.checked })
    },
    {
      label: '开机自动启动',
      type: 'checkbox',
      checked: getOpenAtLoginFromSystem(),
      click: (item) => patch({ openAtLogin: item.checked })
    },
    {
      label: '自动检查更新',
      type: 'checkbox',
      checked: prefs.autoUpdateEnabled !== false,
      click: (item) => patch({ autoUpdateEnabled: item.checked })
    },
    { type: 'separator' },
    {
      label: '检查更新…',
      enabled: app.isPackaged,
      click: () => deps.onCheckUpdate()
    },
    { label: '设置…', click: () => deps.onSettings() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]

  return Menu.buildFromTemplate(template)
}
