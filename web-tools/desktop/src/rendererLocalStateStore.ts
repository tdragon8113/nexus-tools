import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { MANAGED_RENDERER_LOCAL_STATE_KEYS } from '../../shared/rendererLocalState'
import type { RendererLocalStateMap } from '../../shared/rendererLocalState'

function sanitizeMap(raw: unknown): RendererLocalStateMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: RendererLocalStateMap = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string') out[key] = value
  }
  return out
}

export class RendererLocalStateStore {
  private statePath(): string {
    return path.join(app.getPath('userData'), 'renderer-local-state.json')
  }

  private legacySearchStatePath(): string {
    return path.join(app.getPath('userData'), 'desktop-search-state.json')
  }

  private readRaw(): RendererLocalStateMap {
    try {
      const raw = fs.readFileSync(this.statePath(), 'utf8')
      return sanitizeMap(JSON.parse(raw))
    } catch {
      return {}
    }
  }

  /** 合并旧版 desktop-search-state.json（若存在） */
  private mergeLegacySearchState(state: RendererLocalStateMap): RendererLocalStateMap {
    try {
      const raw = fs.readFileSync(this.legacySearchStatePath(), 'utf8')
      const parsed = JSON.parse(raw) as { recents?: unknown; favorites?: unknown }
      const next = { ...state }
      if (!next['nexus-search-recents-v1'] && Array.isArray(parsed.recents)) {
        next['nexus-search-recents-v1'] = JSON.stringify(parsed.recents)
      }
      if (!next['nexus-search-favorites-v1'] && Array.isArray(parsed.favorites)) {
        next['nexus-search-favorites-v1'] = JSON.stringify(parsed.favorites)
      }
      return next
    } catch {
      return state
    }
  }

  read(): RendererLocalStateMap {
    const merged = this.mergeLegacySearchState(this.readRaw())
    const out: RendererLocalStateMap = {}
    for (const key of MANAGED_RENDERER_LOCAL_STATE_KEYS) {
      const value = merged[key]
      if (typeof value === 'string') out[key] = value
    }
    return out
  }

  patch(patch: RendererLocalStateMap): RendererLocalStateMap {
    const current = this.readRaw()
    const next = { ...current }
    for (const [key, value] of Object.entries(patch)) {
      if (!MANAGED_RENDERER_LOCAL_STATE_KEYS.includes(key)) continue
      if (typeof value !== 'string') continue
      next[key] = value
    }
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      fs.writeFileSync(this.statePath(), JSON.stringify(next))
    } catch (err) {
      console.warn('[Nexus Tools] 无法保存 renderer 本地状态', err)
    }
    return this.read()
  }
}
