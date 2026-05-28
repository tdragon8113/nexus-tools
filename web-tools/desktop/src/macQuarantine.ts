import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { app } from 'electron'

const execFileAsync = promisify(execFile)

/** 打包后的 .app 根路径（仅 macOS） */
export function macAppBundlePath(): string | null {
  if (process.platform !== 'darwin' || !app.isPackaged) return null
  return path.resolve(process.execPath, '../../..')
}

async function macAppHasQuarantine(bundlePath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('/usr/bin/xattr', [bundlePath], { timeout: 5000 })
    return stdout.split('\n').some((line) => line.trim() === 'com.apple.quarantine')
  } catch {
    return false
  }
}

/**
 * 首次从 DMG / 浏览器安装后，系统会给 .app 打上隔离标记。
 * 启动时自动清除，避免每次升级后都要手动 xattr -cr。
 */
export async function clearMacAppQuarantine(): Promise<void> {
  const bundlePath = macAppBundlePath()
  if (!bundlePath) return

  try {
    const quarantined = await macAppHasQuarantine(bundlePath)
    if (!quarantined) return

    await execFileAsync('/usr/bin/xattr', ['-cr', bundlePath], { timeout: 60_000 })
    console.log('[Nexus Tools] 已自动清除应用隔离标记')
  } catch (err) {
    console.warn('[Nexus Tools] 自动清除隔离标记失败，可手动执行: xattr -cr "/Applications/Nexus Tools.app"', err)
  }
}
