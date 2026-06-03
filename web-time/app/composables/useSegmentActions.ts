import { showToast } from 'vant'
import {
  buildRecordNotes,
  encodeCardMarker,
  type LifeCard,
  useLifeCards
} from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { calcDurationFromStart, formatMinutes, toLocalIso } from '~/utils/time'

export interface SegmentNotesInput {
  summary?: string
  feelingRating?: number
  tags?: string[]
}

export function useSegmentActions () {
  const saving = useState('segment-actions-saving', () => false)
  const { getAccessToken } = useAuthApi()
  const { createActivity, updateActivity, getOngoingActivity } = useWorkspaceApi()
  const { getRecordTitle } = useLifeCards()
  const { session, clearSession, startSession, syncFromServer } = useActiveSession()
  const { fetchActivities } = useActivities()

  async function requireAuth () {
    if (getAccessToken()) return true
    showToast('请先登录')
    await navigateTo('/auth/login?redirect=/manage/time')
    return false
  }

  async function finishCurrentSegment (notesInput: SegmentNotesInput = {}) {
    if (!session.value) return false
    if (!(await requireAuth())) return false
    if (saving.value) return false

    saving.value = true
    try {
      return await finishCurrentSegmentCore(notesInput)
    } finally {
      saving.value = false
    }
  }

  async function finishCurrentSegmentCore (notesInput: SegmentNotesInput) {
    if (!session.value) return false

    const current = { ...session.value }
    const now = new Date()
    const { minutes } = calcDurationFromStart(current.startedAt, now)
    const title = getRecordTitle(current.parentId, current.childId)
    const notes = buildRecordNotes(
      current.parentId,
      current.childId,
      notesInput.summary ?? '',
      notesInput.feelingRating ?? 0,
      notesInput.tags ?? []
    )

    try {
      const res = await updateActivity(current.activityId, {
        title,
        endTime: toLocalIso(now),
        durationMinutes: minutes,
        notes
      })

      if (res.code === 200) {
        clearSession()
        await fetchActivities()
        showToast(`已结束 · ${title} · ${formatMinutes(minutes)}`)
        return true
      }
      if (res.code === 0) {
        showToast('无法连接服务器，请确认后端已启动')
      } else {
        showToast(res.message || '保存失败')
      }
      return false
    } catch {
      showToast('网络错误，请稍后重试')
      return false
    }
  }

  async function createOngoingSegment (parent: LifeCard, child?: { id: string, label: string }) {
    const startedAt = toLocalIso(new Date())
    const title = getRecordTitle(parent.id, child?.id)
    const notes = encodeCardMarker(parent.id, child?.id)

    const res = await createActivity({
      title,
      category: parent.category,
      startTime: startedAt,
      endTime: null,
      durationMinutes: 0,
      notes
    })

    if (res.code === 200 && res.data) {
      startSession(res.data.id, parent.id, child?.id, res.data.startTime)
      showToast(`已开始 · ${title}`)
      return true
    }
    if (res.code === 409) {
      await syncFromServer()
      showToast(res.message || '已有进行中的记录')
      return false
    }
    if (res.code === 0) {
      showToast('无法连接服务器，请确认后端已启动')
    } else {
      showToast(res.message || '开始失败')
    }
    return false
  }

  async function startSegment (
    parent: LifeCard,
    child?: { id: string, label: string }
  ) {
    if (!(await requireAuth())) return false
    if (session.value) {
      showToast('已有进行中的记录，请先结束后再开始')
      return false
    }
    if (saving.value) return false

    const ongoing = await getOngoingActivity()
    if (ongoing.code === 200 && ongoing.data) {
      await syncFromServer()
      showToast('已有进行中的记录，请先结束后再开始')
      return false
    }

    saving.value = true
    try {
      return createOngoingSegment(parent, child)
    } finally {
      saving.value = false
    }
  }

  async function quickSwitch (
    parent: LifeCard,
    child?: { id: string, label: string }
  ) {
    if (!session.value) return false
    if (!(await requireAuth())) return false
    if (saving.value) return false

    saving.value = true
    try {
      const ended = await finishCurrentSegmentCore({})
      if (!ended) return false
      return createOngoingSegment(parent, child)
    } finally {
      saving.value = false
    }
  }

  async function endCurrentOnly (notesInput: SegmentNotesInput = {}) {
    return finishCurrentSegment(notesInput)
  }

  return {
    saving,
    finishCurrentSegment,
    createOngoingSegment,
    startSegment,
    quickSwitch,
    endCurrentOnly
  }
}
