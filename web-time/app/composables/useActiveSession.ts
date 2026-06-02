import { decodeCardMarker } from '~/composables/useLifeCards'
import type { Activity } from '~/composables/useWorkspaceApi'
import { normalizeDateTime, toLocalIso } from '~/utils/time'

export interface ActiveSession {
  activityId: number
  parentId: string
  childId?: string
  startedAt: string
}

const STORAGE_PREFIX = 'nexus_active_session'

function sessionStorageKey (userId?: number | null) {
  return userId != null ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX
}

export function useActiveSession () {
  const { getUserId, getAccessToken } = useApiClient()
  const { getRecordTitle, getCard } = useLifeCards()
  const { getOngoingActivity } = useWorkspaceApi()
  const session = useState<ActiveSession | null>('activeSession', () => null)
  const elapsedSeconds = ref(0)

  let timer: ReturnType<typeof setInterval> | null = null

  const tick = () => {
    if (!session.value) {
      elapsedSeconds.value = 0
      return
    }
    const start = new Date(session.value.startedAt.replace(' ', 'T'))
    elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000))
  }

  const startTimer = () => {
    tick()
    if (timer) clearInterval(timer)
    timer = setInterval(tick, 1000)
  }

  const stopTimer = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const persist = (next: ActiveSession | null) => {
    session.value = next
    if (typeof window === 'undefined') return
    const key = sessionStorageKey(getUserId())
    if (next) {
      localStorage.setItem(key, JSON.stringify(next))
    } else {
      localStorage.removeItem(key)
    }
    tick()
  }

  function hydrateFromActivity (activity: Activity) {
    const marker = decodeCardMarker(activity.notes)
    if (!marker) return false
    persist({
      activityId: activity.id,
      parentId: marker.parentId,
      childId: marker.childId,
      startedAt: normalizeDateTime(activity.startTime)
    })
    return true
  }

  const load = () => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(sessionStorageKey(getUserId()))
    if (!raw) {
      session.value = null
      return
    }
    try {
      const parsed = JSON.parse(raw) as ActiveSession
      if (parsed?.parentId && parsed.activityId) {
        session.value = parsed
      } else {
        session.value = null
        localStorage.removeItem(sessionStorageKey(getUserId()))
      }
    } catch {
      session.value = null
    }
    tick()
  }

  /** 与云端进行中记录对齐（刷新后恢复） */
  async function syncFromServer () {
    if (!getAccessToken()) {
      persist(null)
      return null
    }
    const res = await getOngoingActivity()
    if (res.code === 200 && res.data) {
      hydrateFromActivity(res.data)
      return res.data
    }
    if (res.code === 200) {
      persist(null)
    }
    return null
  }

  const startSession = (
    activityId: number,
    parentId: string,
    childId: string | undefined,
    startedAt: string
  ) => {
    persist({
      activityId,
      parentId,
      childId,
      startedAt: normalizeDateTime(startedAt) || toLocalIso(new Date())
    })
  }

  const clearSession = () => persist(null)

  const sessionTitle = computed(() => {
    if (!session.value) return ''
    return getRecordTitle(session.value.parentId, session.value.childId)
  })

  const sessionCard = computed(() => {
    if (!session.value) return null
    return getCard(session.value.parentId)
  })

  const hasSession = computed(() => session.value != null)

  onMounted(() => {
    load()
    startTimer()
  })

  onUnmounted(stopTimer)

  watch(session, () => tick())

  return {
    session,
    hasSession,
    load,
    syncFromServer,
    hydrateFromActivity,
    startSession,
    clearSession,
    sessionTitle,
    sessionCard,
    elapsedSeconds
  }
}
