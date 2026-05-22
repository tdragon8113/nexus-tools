import { pinyin } from 'pinyin-pro'
import type { SiteTool } from './tools'

const CJK_RUN = /[\u4e00-\u9fff]+/g

/** 从文本中提取中文并生成全拼、首字母（无声调、无分隔） */
export function pinyinFromChinese(text: string): { full: string; initials: string } {
  const parts = text.match(CJK_RUN)
  if (!parts?.length) return { full: '', initials: '' }

  const joined = parts.join('')
  const full = pinyin(joined, { toneType: 'none', separator: '' }).toLowerCase()
  const initials = pinyin(joined, { pattern: 'first', toneType: 'none', separator: '' }).toLowerCase()
  return { full, initials }
}

const aliasCache = new Map<string, string[]>()

/** 工具可搜索的拼音别名（全拼 + 首字母，按 name/desc/中文关键词 生成） */
export function getToolPinyinAliases(tool: SiteTool): string[] {
  const cached = aliasCache.get(tool.id)
  if (cached) return cached

  const set = new Set<string>()
  const absorb = (text: string) => {
    const { full, initials } = pinyinFromChinese(text)
    if (full.length >= 2) set.add(full)
    if (initials.length >= 2) set.add(initials)
  }

  absorb(tool.name)
  absorb(tool.desc)
  for (const kw of tool.keywords ?? []) {
    if (CJK_RUN.test(kw)) absorb(kw)
  }

  const list = [...set]
  aliasCache.set(tool.id, list)
  return list
}
