import { app } from 'electron'

/** 是否支持通过 Electron 注册登录项（macOS / Windows / Linux） */
export function isLoginItemSupported(): boolean {
  return process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux'
}

export function getOpenAtLoginFromSystem(): boolean {
  if (!isLoginItemSupported()) return false
  try {
    return app.getLoginItemSettings().openAtLogin
  } catch {
    return false
  }
}

export function wasOpenedAtLogin(): boolean {
  if (!isLoginItemSupported()) return false
  try {
    return app.getLoginItemSettings().wasOpenedAtLogin === true
  } catch {
    return false
  }
}

/** 将「开机启动」偏好同步到系统登录项 */
export function applyOpenAtLogin(enabled: boolean): void {
  if (!isLoginItemSupported()) return

  try {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true
      })
      return
    }

    if (process.platform === 'win32') {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath
      })
      return
    }

    app.setLoginItemSettings({ openAtLogin: enabled })
  } catch (err) {
    console.warn('[Nexus Tools] 无法设置开机启动', err)
  }
}
