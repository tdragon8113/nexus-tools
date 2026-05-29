import { Tray } from 'electron'
import { getTrayIcon } from './appIcon'
import { buildTrayContextMenu, type TrayMenuDeps } from './trayMenu'

function trayIconImage() {
  const icon = getTrayIcon()
  if (!icon || icon.isEmpty()) return null
  return icon
}

export type AppTrayController = {
  dispose(): void
}

/** 菜单栏 / 系统托盘：左键搜索，右键快捷开关 + 设置页 */
export function setupAppTray(deps: TrayMenuDeps & { hotkey: string }): AppTrayController | null {
  const image = trayIconImage()
  if (!image) {
    console.warn('[Nexus Tools] 未找到托盘图标，跳过菜单栏图标')
    return null
  }

  const tray = new Tray(image)
  tray.setToolTip(`Nexus Tools · ${deps.hotkey} 唤起搜索`)

  const showContextMenu = () => {
    // 必须用 tray.popUpContextMenu(menu)，menu.popup 在 macOS 菜单栏会偏到奇怪位置
    tray.popUpContextMenu(buildTrayContextMenu(deps))
  }

  if (process.platform === 'darwin') {
    tray.on('click', () => deps.onSearch())
    tray.on('right-click', showContextMenu)
  } else {
    tray.on('click', () => deps.onSearch())
    tray.on('right-click', showContextMenu)
  }

  return {
    dispose() {
      if (!tray.isDestroyed()) tray.destroy()
    }
  }
}
