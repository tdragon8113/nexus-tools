import { showToast } from 'vant'
import type { Activity } from '~/composables/useWorkspaceApi'
import { parseRecordNotes } from '~/composables/useLifeCards'
import { showApiError } from '~/composables/useApiToast'

export interface TagStat {
  tag: string
  count: number
}

export function computeTagStats (activities: Activity[]): TagStat[] {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    for (const tag of parseRecordNotes(activity.notes).tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'))
}

/** 云端活动列表：共享缓存，供记录页/标签页复用 */
export function useActivities () {
  const activities = useState<Activity[]>('workspace-activities', () => [])
  const loading = useState('workspace-activities-loading', () => false)

  const { getActivities, deleteActivity } = useWorkspaceApi()
  const { getAccessToken } = useApiClient()
  const { sync: syncAuth } = useAuthSession()

  const tagStats = computed(() => computeTagStats(activities.value))

  async function fetchActivities () {
    if (!getAccessToken()) {
      activities.value = []
      loading.value = false
      return
    }

    loading.value = true
    try {
      const res = await getActivities()
      if (res.code === 200 && Array.isArray(res.data)) {
        activities.value = res.data
      } else {
        activities.value = []
        if (res.code === 401) {
          syncAuth()
        } else {
          showApiError(res, '加载记录失败')
        }
      }
    } catch {
      showToast('网络错误，请稍后重试')
    } finally {
      loading.value = false
    }
  }

  async function removeActivity (id: number) {
    const res = await deleteActivity(id)
    if (res.code === 200) {
      activities.value = activities.value.filter(a => a.id !== id)
      showToast('已删除')
      return true
    }
    showApiError(res, '删除失败')
    return false
  }

  function invalidate () {
    activities.value = []
  }

  return {
    activities,
    loading,
    tagStats,
    fetchActivities,
    removeActivity,
    invalidate
  }
}
