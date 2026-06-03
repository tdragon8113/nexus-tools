/** 与后端 LifeCardDto 对齐，仅 id + 名称 */
export interface ApiLifeCardChild {
  id: string
  label: string
}

export interface ApiLifeCard {
  id: string
  label: string
  children?: ApiLifeCardChild[]
}

export function parseApiLifeCards (raw: unknown): ApiLifeCard[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const record = item as Record<string, unknown>
    const children = Array.isArray(record.children)
      ? record.children.map((child) => {
        const c = child as Record<string, unknown>
        return {
          id: String(c.id ?? ''),
          label: String(c.label ?? '')
        }
      }).filter(c => c.id && c.label)
      : []
    return {
      id: String(record.id ?? ''),
      label: String(record.label ?? ''),
      children
    }
  }).filter(card => card.id && card.label)
}

export function toApiLifeCards (cards: ApiLifeCard[]): ApiLifeCard[] {
  return cards.map(card => ({
    id: card.id,
    label: card.label.trim(),
    children: (card.children ?? []).map(child => ({
      id: child.id,
      label: child.label.trim()
    }))
  }))
}

/** 从前端状态提取 API 载荷（丢弃所有展示字段） */
export function lifeCardsToApiPayload (cards: Array<{
  id: string
  label: string
  children?: Array<{ id: string, label: string }>
}>): ApiLifeCard[] {
  return toApiLifeCards(cards.map(card => ({
    id: card.id,
    label: card.label,
    children: card.children ?? []
  })))
}
