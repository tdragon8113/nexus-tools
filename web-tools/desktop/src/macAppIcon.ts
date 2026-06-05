import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app, nativeImage } from 'electron'

const APP_ROOTS = ['/Applications', '/System/Applications', path.join(os.homedir(), 'Applications')]
const ICON_LOAD_CONCURRENCY = 2

const pngCache = new Map<string, Buffer>()
let iconLoadsInFlight = 0
const iconLoadWaiters: Array<() => void> = []

function readBundleIconFileName(appPath: string): string | null {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist')
  if (!fs.existsSync(plistPath)) return null
  try {
    const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], {
      encoding: 'utf8',
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    const info = JSON.parse(json) as Record<string, unknown>
    const raw = info.CFBundleIconFile ?? info.CFBundleIconName
    if (typeof raw !== 'string' || !raw.trim()) return null
    const name = raw.trim()
    return name.endsWith('.icns') ? name : `${name}.icns`
  } catch {
    return null
  }
}

function findBundleIconPath(appPath: string): string | null {
  const resourcesDir = path.join(appPath, 'Contents', 'Resources')
  if (!fs.existsSync(resourcesDir)) return null

  const fromPlist = readBundleIconFileName(appPath)
  if (fromPlist) {
    const full = path.join(resourcesDir, fromPlist)
    if (fs.existsSync(full)) return full
  }

  const preferred = ['AppIcon.icns', 'app.icns', 'icon.icns']
  for (const name of preferred) {
    const full = path.join(resourcesDir, name)
    if (fs.existsSync(full)) return full
  }

  try {
    const icns = fs.readdirSync(resourcesDir).find((name) => name.endsWith('.icns'))
    return icns ? path.join(resourcesDir, icns) : null
  } catch {
    return null
  }
}

function icnsFileToPngBuffer(icnsPath: string): Buffer | null {
  if (process.platform !== 'darwin') return null
  const out = path.join(app.getPath('temp'), `nexus-icns-${randomBytes(8).toString('hex')}.png`)
  try {
    execFileSync(
      'sips',
      ['-z', '64', '64', '-s', 'format', 'png', icnsPath, '--out', out],
      {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore']
      }
    )
    const buf = fs.readFileSync(out)
    return buf.length ? buf : null
  } catch {
    return null
  } finally {
    try {
      fs.unlinkSync(out)
    } catch {
      /* ignore */
    }
  }
}

function normalizeIconImage(image: Electron.NativeImage): Electron.NativeImage | null {
  if (image.isEmpty()) return null
  const { width, height } = image.getSize()
  if (width <= 0 || height <= 0) return null
  if (width > 128 || height > 128) return image.resize({ width: 64, height: 64 })
  if (width > 72 || height > 72) return image.resize({ width: 64, height: 64 })
  return image
}

function resolveMacAppPath(appPath: string): string | null {
  if (!appPath.endsWith('.app')) return null
  try {
    return fs.realpathSync(appPath)
  } catch {
    return null
  }
}

async function acquireIconLoadSlot(): Promise<void> {
  if (iconLoadsInFlight < ICON_LOAD_CONCURRENCY) {
    iconLoadsInFlight += 1
    return
  }
  await new Promise<void>((resolve) => {
    iconLoadWaiters.push(resolve)
  })
  iconLoadsInFlight += 1
}

function releaseIconLoadSlot(): void {
  iconLoadsInFlight = Math.max(0, iconLoadsInFlight - 1)
  const next = iconLoadWaiters.shift()
  if (next) next()
}

async function withIconLoadSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireIconLoadSlot()
  try {
    return await fn()
  } finally {
    releaseIconLoadSlot()
  }
}

async function loadMacAppIconImage(appPath: string): Promise<Electron.NativeImage | null> {
  const resolved = resolveMacAppPath(appPath) ?? appPath

  const iconPath = findBundleIconPath(resolved)
  if (iconPath) {
    const pngBuf = icnsFileToPngBuffer(iconPath)
    if (pngBuf?.length) {
      try {
        const image = nativeImage.createFromBuffer(pngBuf)
        const normalized = normalizeIconImage(image)
        if (normalized) return normalized
      } catch {
        /* fall through */
      }
    }
  }

  try {
    const image = await app.getFileIcon(resolved, { size: 'large' })
    return normalizeIconImage(image)
  } catch {
    return null
  }
}

/** 仅允许 Applications 目录下的 .app，防止被滥用读取任意路径 */
export function isAllowedMacAppPath(appPath: string): boolean {
  if (!appPath.endsWith('.app')) return false
  let resolved: string
  try {
    resolved = fs.realpathSync(appPath)
  } catch {
    return false
  }

  return APP_ROOTS.some((root) => {
    if (!fs.existsSync(root)) return false
    let rootResolved: string
    try {
      rootResolved = fs.realpathSync(root)
    } catch {
      return false
    }
    return resolved === rootResolved || resolved.startsWith(`${rootResolved}${path.sep}`)
  })
}

/** 主进程 IPC 读取 .app 图标 PNG（须在主线程调用） */
export async function getMacAppIconPngBuffer(appPath: string): Promise<Buffer | null> {
  if (process.platform !== 'darwin') return null
  if (!isAllowedMacAppPath(appPath)) return null

  const resolved = resolveMacAppPath(appPath) ?? appPath
  const cached = pngCache.get(resolved)
  if (cached) return cached

  return withIconLoadSlot(async () => {
    const cachedAgain = pngCache.get(resolved)
    if (cachedAgain) return cachedAgain

    try {
      const image = await loadMacAppIconImage(appPath)
      if (!image) return null
      const png = image.toPNG()
      if (!png.length) return null
      pngCache.set(resolved, png)
      return png
    } catch (err) {
      console.warn('[Nexus Tools] 读取应用图标失败', appPath, err)
      return null
    }
  })
}

/** 渲染进程 <img src> 用（IPC data URL） */
export async function getMacAppIconDataUrl(appPath: string): Promise<string | null> {
  const png = await getMacAppIconPngBuffer(appPath)
  if (!png?.length) return null
  return `data:image/png;base64,${png.toString('base64')}`
}

export function clearMacAppIconCache() {
  pngCache.clear()
}
