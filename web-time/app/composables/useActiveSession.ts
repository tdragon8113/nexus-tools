import { toLocalIso } from '~/utils/time'

export interface ActiveSession {
  parentId: string
  childId?: string
  startedAt: string
}

const STORAGE_PREFIX = 'nexus_active_session'

function sessionStorageKey (userId?: number | null) {
  return userId != null ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX
}

export function useActiveSession () {
  const { getUserId } = useApiClient()
  const { getRecordTitle, getCard } = useLifeCards()
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

  const load = () => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(sessionStorageKey(getUserId()))
    if (!raw) {
      session.value = null
      return
    }
    try {
      session.value = JSON.parse(raw) as ActiveSession
    } catch {
      session.value = null
    }
    tick()
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

  const startSession = (parentId: string, childId?: string) => {
    persist({
      parentId,
      childId,
      startedAt: toLocalIso(new Date())
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
    startSession,
    clearSession,
    sessionTitle,
    sessionCard,
    elapsedSeconds
  }
}
