import { pinyinFromChinese } from './pinyin'
import type { MacAppEntry } from '~~/shared/macApps'

function fieldIncludes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle)
}

function tokenizeQuery(q: string): string[] {
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const compact = q.toLowerCase().replace(/\s+/g, '')
  if (compact.length >= 1 && !tokens.includes(compact)) {
    tokens.push(compact)
  }
  return tokens
}

function pinyinAliasesForName(name: string): string[] {
  const { full, initials } = pinyinFromChinese(name)
  const list: string[] = []
  if (full.length >= 1) list.push(full)
  if (initials.length >= 1 && initials !== full) list.push(initials)
  return list
}

export function scoreMacApp(app: MacAppEntry, tokens: string[]): number {
  if (!tokens.length) return -1

  const name = app.name.toLowerCase()
  const pinyinAliases = pinyinAliasesForName(app.name)
  let score = 0
  let matchedTokens = 0

  for (const token of tokens) {
    let tokenScore = 0
    if (name === token) tokenScore = Math.max(tokenScore, 120)
    else if (name.startsWith(token)) tokenScore = Math.max(tokenScore, 100)
    else if (fieldIncludes(name, token)) tokenScore = Math.max(tokenScore, 85)

    for (const py of pinyinAliases) {
      if (py === token) tokenScore = Math.max(tokenScore, 98)
      else if (py.startsWith(token)) tokenScore = Math.max(tokenScore, 92)
      else if (token.length >= 2 && fieldIncludes(py, token)) tokenScore = Math.max(tokenScore, 78)
    }

    if (tokenScore === 0) continue
    matchedTokens++
    score += tokenScore
  }

  if (matchedTokens === 0) return -1
  return score
}

export interface ScoredMacApp {
  app: MacAppEntry
  score: number
}

export function searchMacApps(query: string, apps: MacAppEntry[], limit = 5): MacAppEntry[] {
  const q = query.trim()
  if (!q || !apps.length) return []

  const tokens = tokenizeQuery(q)
  return apps
    .map((app) => ({ app, score: scoreMacApp(app, tokens) }))
    .filter((item): item is ScoredMacApp => item.score > 0)
    .sort((a, b) => b.score - a.score || a.app.name.localeCompare(b.app.name, 'zh-Hans-CN'))
    .slice(0, limit)
    .map((item) => item.app)
}
