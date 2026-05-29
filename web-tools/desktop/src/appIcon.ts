import { app, nativeImage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

let cached: Electron.NativeImage | null | undefined

/** 开发/未打包时使用 icons/icon.png；打包后可用 icons/icon.icns */
export function getAppIcon(): Electron.NativeImage | undefined {
  if (cached !== undefined) return cached ?? undefined

  const base = path.join(__dirname, '..', 'icons')
  const candidates = [
    path.join(base, 'icon.icns'),
    path.join(base, 'icon.png')
  ]

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const image = nativeImage.createFromPath(file)
    if (!image.isEmpty()) {
      cached = image
      return image
    }
  }

  cached = null
  return undefined
}

export function applyDockIcon() {
  if (process.platform !== 'darwin') return
  const icon = getAppIcon()
  if (icon) app.dock?.setIcon(icon)
}

let trayCached: Electron.NativeImage | null | undefined

/** macOS 菜单栏：Template 单色图标（与系统其它菜单栏图标一致） */
export function getTrayIcon(): Electron.NativeImage | undefined {
  if (process.platform === 'darwin') {
    if (trayCached !== undefined) return trayCached ?? undefined

    const base = path.join(__dirname, '..', 'icons')
    const candidates = [path.join(base, 'trayTemplate@2x.png'), path.join(base, 'trayTemplate.png')]

    for (const file of candidates) {
      if (!fs.existsSync(file)) continue
      const image = nativeImage.createFromPath(file)
      if (!image.isEmpty()) {
        image.setTemplateImage(true)
        trayCached = image
        return image
      }
    }
    trayCached = null
  }

  const icon = getAppIcon()
  if (!icon) return undefined
  const size = process.platform === 'win32' ? 16 : 22
  return icon.resize({ width: size, height: size })
}
