import type { MacAppEntry } from '~~/shared/macApps'
import type { SiteTool } from './tools'

export type SearchResultKind = 'tool' | 'mac-app'

export interface SearchResultItem {
  id: string
  kind: SearchResultKind
  title: string
  subtitle: string
  badge: string
  icon: string
  bgColor: string
  iconColor: string
  /** 列表分组标题（如「最近使用」） */
  section?: string
  tool?: SiteTool
  app?: MacAppEntry
}

export function toolToSearchResult(tool: SiteTool): SearchResultItem {
  return {
    id: `tool:${tool.id}`,
    kind: 'tool',
    title: tool.name,
    subtitle: tool.desc,
    badge: '工具',
    icon: tool.icon,
    bgColor: tool.bgColor,
    iconColor: tool.iconColor,
    tool
  }
}

export function macAppToSearchResult(app: MacAppEntry): SearchResultItem {
  return {
    id: `app:${app.id}`,
    kind: 'mac-app',
    title: app.name,
    subtitle: 'Mac 应用程序',
    badge: 'Application',
    icon: 'apps-o',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-600',
    app
  }
}

export function mergeSearchResults(tools: SiteTool[], apps: MacAppEntry[]): SearchResultItem[] {
  return [...tools.map(toolToSearchResult), ...apps.map(macAppToSearchResult)]
}

/** 去掉分区后缀（如 tool:ip@catalog → tool:ip） */
export function canonicalSearchItemId(id: string): string {
  const at = id.indexOf('@')
  return at >= 0 ? id.slice(0, at) : id
}

export function toolIdFromSearchItemId(id: string): string {
  const base = canonicalSearchItemId(id)
  return base.startsWith('tool:') ? base.slice(5) : base
}
