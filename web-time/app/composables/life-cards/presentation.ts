import type { ActivityCategory } from '../useWorkspaceApi'
import type { ApiLifeCard } from './api-types'

export type LifeCardColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'slate'

export interface LifeCardChild {
  id: string
  label: string
}

/** 前端视图模型：API 数据 + 展示属性（纯前端推导，不持久化到后端） */
export interface LifeCard {
  id: string
  label: string
  icon: string
  color: LifeCardColor
  category: ActivityCategory
  children: LifeCardChild[]
}

const COLOR_CYCLE: LifeCardColor[] = ['slate', 'amber', 'emerald', 'rose', 'indigo', 'sky']
const ICON_CYCLE = ['flower-o', 'briefcase-o', 'smile-o', 'fire-o', 'bookmark-o', 'friends-o', 'location-o'] as const

const LABEL_PRESENTATION: Record<string, Pick<LifeCard, 'icon' | 'color' | 'category'>> = {
  日常: { icon: 'flower-o', color: 'slate', category: 'other' },
  工作: { icon: 'briefcase-o', color: 'amber', category: 'meeting' },
  休息: { icon: 'smile-o', color: 'emerald', category: 'pomodoro-break' },
  运动: { icon: 'fire-o', color: 'rose', category: 'other' },
  阅读: { icon: 'bookmark-o', color: 'indigo', category: 'other' },
  社交: { icon: 'friends-o', color: 'emerald', category: 'other' },
  出行: { icon: 'location-o', color: 'sky', category: 'other' }
}

function resolvePresentation (label: string, index: number): Pick<LifeCard, 'icon' | 'color' | 'category'> {
  const known = LABEL_PRESENTATION[label.trim()]
  if (known) return { ...known }
  return {
    icon: ICON_CYCLE[index % ICON_CYCLE.length],
    color: COLOR_CYCLE[index % COLOR_CYCLE.length],
    category: 'other'
  }
}

export function apiToLifeCards (apiCards: ApiLifeCard[]): LifeCard[] {
  return apiCards.map((card, index) => {
    const presentation = resolvePresentation(card.label, index)
    return {
      id: card.id,
      label: card.label,
      ...presentation,
      children: (card.children ?? []).map(child => ({
        id: child.id,
        label: child.label
      }))
    }
  })
}

export const LIFE_CARD_COLORS: Record<LifeCardColor, { bg: string; text: string; ring: string }> = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-400' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-400' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-400' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-400' }
}
