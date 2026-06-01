import type { ApiResponse } from './useApiClient'

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

export function useWorkspaceApi () {
  const { request } = useApiClient()

  const getActivities = () =>
    request<Activity[]>('/api/v1/activities')

  const createActivity = (payload: CreateActivityPayload) =>
    request<Activity>('/api/v1/activities', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

  const deleteActivity = (id: number) =>
    request<void>(`/api/v1/activities/${id}`, { method: 'DELETE' })

  const getStats = () =>
    request<Stats>('/api/v1/activities/stats')

  return {
    getActivities,
    createActivity,
    deleteActivity,
    getStats
  }
}
