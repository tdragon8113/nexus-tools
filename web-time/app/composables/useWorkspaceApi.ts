import type { ApiResponse } from './useApiClient'
import { normalizeDateTime } from '~/utils/time'

export type ActivityCategory = 'pomodoro-work' | 'pomodoro-break' | 'meeting' | 'other'

export interface Activity {
  id: number
  title: string
  category: ActivityCategory
  startTime: string
  endTime: string | null
  durationMinutes: number
  notes: string | null
  createdAt: string
}

export interface CreateActivityPayload {
  title: string
  category: ActivityCategory
  startTime: string
  endTime?: string | null
  durationMinutes?: number
  notes?: string
}

export interface UpdateActivityPayload {
  title?: string
  endTime: string
  durationMinutes: number
  notes?: string
}

export interface Stats {
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
  totalSessions: number
  hourlyDistribution: Record<string, number>
  dailyDistribution: Record<string, number>
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  'pomodoro-work': '专注',
  'pomodoro-break': '休息',
  meeting: '工作',
  other: '日常'
}

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'pomodoro-work',
  'pomodoro-break',
  'meeting',
  'other'
]

function normalizeCategory (value: unknown): ActivityCategory {
  if (typeof value === 'string' && ACTIVITY_CATEGORIES.includes(value as ActivityCategory)) {
    return value as ActivityCategory
  }
  return 'other'
}

/** 将 API 原始项规范为前端可用结构（日期字段、分类） */
export function normalizeActivity (raw: Record<string, unknown>): Activity {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    category: normalizeCategory(raw.category),
    startTime: normalizeDateTime(raw.startTime),
    endTime: raw.endTime != null && raw.endTime !== '' ? normalizeDateTime(raw.endTime) : null,
    durationMinutes: Number(raw.durationMinutes ?? 0),
    notes: raw.notes != null ? String(raw.notes) : null,
    createdAt: normalizeDateTime(raw.createdAt)
  }
}

export function useWorkspaceApi () {
  const { request } = useApiClient()

  const getActivities = async () => {
    const res = await request<Activity[]>('/api/v1/activities')
    if (res.code === 200 && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(item => normalizeActivity(item as unknown as Record<string, unknown>))
      }
    }
    return res
  }

  const createActivity = async (payload: CreateActivityPayload) => {
    const res = await request<Activity>('/api/v1/activities', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        endTime: payload.endTime ?? null,
        durationMinutes: payload.durationMinutes ?? 0
      })
    })
    if (res.code === 200 && res.data) {
      return {
        ...res,
        data: normalizeActivity(res.data as unknown as Record<string, unknown>)
      }
    }
    return res
  }

  const getOngoingActivity = async () => {
    const res = await request<Activity | null>('/api/v1/activities/ongoing')
    if (res.code === 200 && res.data) {
      return {
        ...res,
        data: normalizeActivity(res.data as unknown as Record<string, unknown>)
      }
    }
    return res
  }

  const updateActivity = async (id: number, payload: UpdateActivityPayload) => {
    const res = await request<Activity>(`/api/v1/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    if (res.code === 200 && res.data) {
      return {
        ...res,
        data: normalizeActivity(res.data as unknown as Record<string, unknown>)
      }
    }
    return res
  }

  const deleteActivity = (id: number) =>
    request<void>(`/api/v1/activities/${id}`, { method: 'DELETE' })

  const getStats = () =>
    request<Stats>('/api/v1/activities/stats')

  return {
    getActivities,
    getOngoingActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getStats
  }
}
