import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { MacAppEntry } from '../../shared/macApps'

const APP_ROOTS = [
  '/Applications',
  '/System/Applications',
  path.join(os.homedir(), 'Applications')
]

const MAX_SCAN_DEPTH = 2

let cachedApps: MacAppEntry[] | null = null
let scanPromise: Promise<MacAppEntry[]> | null = null

function readAppDisplayName(appPath: string): string {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist')
  const fallback = path.basename(appPath, '.app')
  if (!fs.existsSync(plistPath)) return fallback

  try {
    const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], {
      encoding: 'utf8',
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    const info = JSON.parse(json) as Record<string, unknown>
    const name = info.CFBundleDisplayName ?? info.CFBundleName
    if (typeof name === 'string' && name.trim()) return name.trim()
  } catch {
    /* plutil 不可用或 plist 异常时回退目录名 */
  }
  return fallback
}

function collectAppsInDir(root: string, depth = 0): MacAppEntry[] {
  if (depth > MAX_SCAN_DEPTH || !fs.existsSync(root)) return []

  const entries: MacAppEntry[] = []
  let dirents: fs.Dirent[]
  try {
    dirents = fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return entries
  }

  for (const dirent of dirents) {
    if (dirent.name.startsWith('.')) continue
    const fullPath = path.join(root, dirent.name)
    if (!dirent.isDirectory()) continue

    if (dirent.name.endsWith('.app')) {
      entries.push({
        id: fullPath,
        name: readAppDisplayName(fullPath),
        path: fullPath
      })
      continue
    }

    if (depth < MAX_SCAN_DEPTH) {
      entries.push(...collectAppsInDir(fullPath, depth + 1))
    }
  }

  return entries
}

function dedupeApps(apps: MacAppEntry[]): MacAppEntry[] {
  const byPath = new Map<string, MacAppEntry>()
  for (const app of apps) {
    if (!byPath.has(app.path)) byPath.set(app.path, app)
  }
  return [...byPath.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
}

export async function listMacApplications(): Promise<MacAppEntry[]> {
  if (process.platform !== 'darwin') return []
  if (cachedApps) return cachedApps
  if (scanPromise) return scanPromise

  scanPromise = Promise.resolve().then(() => {
    const collected: MacAppEntry[] = []
    for (const root of APP_ROOTS) {
      collected.push(...collectAppsInDir(root))
    }
    cachedApps = dedupeApps(collected)
    return cachedApps
  })

  return scanPromise
}

export function invalidateMacApplicationsCache() {
  cachedApps = null
  scanPromise = null
}
