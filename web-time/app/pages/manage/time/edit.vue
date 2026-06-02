<template>
  <div class="px-4 py-4 space-y-4">
    <div
      v-if="mounted && !authed"
      class="doc-surface p-4 flex items-start gap-3"
    >
      <van-icon name="info-o" size="20" class="text-indigo-500 shrink-0 mt-0.5" />
      <p class="text-sm text-slate-700">登录后才能保存记录，可先体验选卡片</p>
    </div>

    <!-- 无进行中：选卡片并开始（立即写入云端） -->
    <template v-if="!hasSession">
      <div class="doc-surface px-4 py-3">
        <LifeCardPicker v-model="nextPick" mode="start" :saving="saving" />
      </div>
      <van-button
        round
        block
        type="primary"
        class="!border-0 !bg-indigo-600"
        :loading="saving"
        :disabled="!nextPick.parentId"
        @click="confirmStart"
      >
        开始记录
      </van-button>
    </template>

    <!-- 有进行中：补充总结后结束或切换下一段 -->
    <template v-else>
      <div class="doc-surface p-4 space-y-3">
        <div class="flex items-start gap-3">
          <div
            v-if="sessionCard"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            :class="LIFE_CARD_COLORS[sessionCard.color].bg"
          >
            <van-icon
              :name="sessionCard.icon"
              size="22"
              :class="LIFE_CARD_COLORS[sessionCard.color].text"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-indigo-600 font-medium">进行中</p>
            <p class="text-base font-semibold text-slate-900">{{ sessionTitle }}</p>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ formatTimeOfDay(session!.startedAt) }} 起 · 已持续 {{ elapsedLabel }}
            </p>
          </div>
        </div>
      </div>

      <div class="doc-surface overflow-hidden divide-y divide-slate-100">
        <div class="px-3 py-3">
          <SummaryEditor v-model="summary" />
        </div>
        <div class="flex items-center gap-3 px-4 py-3">
          <span class="w-10 shrink-0 text-sm text-slate-600">感受</span>
          <FeelingStars v-model="feelingRating" class="min-w-0 flex-1" />
        </div>
        <div class="flex items-start gap-3 px-4 py-3">
          <span class="w-10 shrink-0 pt-1.5 text-sm text-slate-600">标签</span>
          <RecordTagPicker v-model="selectedTags" class="min-w-0 flex-1" />
        </div>
        <div class="px-4 py-3">
          <LifeCardPicker v-model="nextPick" mode="switch" :saving="saving" />
        </div>
      </div>

      <van-button
        round
        block
        type="primary"
        class="!border-0 !bg-indigo-600"
        :loading="saving"
        :disabled="!nextPick.parentId"
        @click="confirmSwitch"
      >
        结束本条并开始下一段
      </van-button>

      <van-button
        round
        block
        plain
        type="default"
        :loading="saving"
        @click="handleEndOnly"
      >
        结束记录
      </van-button>
    </template>

    <van-button round block plain type="default" @click="handleCancel">
      返回
    </van-button>

    <p class="text-center text-xs text-slate-400">
      <NuxtLink :to="linkWithBack('/profile/cards')" class="text-indigo-500">
        管理生活卡片
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import {
  buildRecordNotes,
  encodeCardMarker,
  LIFE_CARD_COLORS,
  parseRecordNotes,
  type LifeCard,
  useLifeCards
} from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { calcDurationFromStart, formatDuration, formatMinutes, formatTimeOfDay, toLocalIso } from '~/utils/time'

definePageMeta({
  layout: 'default'
})

useHead({ title: '写记录 · Nexus Time' })

const { mounted, authed } = useAuthSession()
const { getAccessToken } = useAuthApi()
const { createActivity, updateActivity, getOngoingActivity } = useWorkspaceApi()
const { load, getRecordTitle, getCard, getChild } = useLifeCards()
const {
  session,
  hasSession,
  load: loadSession,
  syncFromServer,
  startSession,
  clearSession,
  sessionTitle,
  sessionCard,
  elapsedSeconds
} = useActiveSession()

const { linkWithBack, resolveBack } = useBackNavigation()

const summary = ref('')
const feelingRating = ref(3)
const selectedTags = ref<string[]>([])
const nextPick = ref<{ parentId: string, childId?: string }>({ parentId: '' })
const saving = ref(false)

const elapsedLabel = computed(() => formatDuration(elapsedSeconds.value))

onMounted(async () => {
  load()
  loadSession()
  if (getAccessToken()) {
    const ongoing = await syncFromServer()
    if (ongoing?.notes) {
      const parsed = parseRecordNotes(ongoing.notes)
      if (parsed.summary) summary.value = parsed.summary
      if (parsed.feelingRating) feelingRating.value = parsed.feelingRating
      if (parsed.tags?.length) selectedTags.value = parsed.tags
    }
  }
})

function handleCancel () {
  void navigateTo(resolveBack('/manage/time'))
}

function resetForm () {
  summary.value = ''
  feelingRating.value = 3
  selectedTags.value = []
}

async function requireAuth () {
  if (getAccessToken()) return true
  showToast('请先登录')
  await navigateTo('/auth/login?redirect=/manage/time/edit')
  return false
}

function resolvePick () {
  const parent = getCard(nextPick.value.parentId)
  if (!parent) return null
  const child = nextPick.value.childId
    ? getChild(nextPick.value.parentId, nextPick.value.childId)
    : undefined
  return { parent, child }
}

async function assertNoOngoing (): Promise<boolean> {
  const res = await getOngoingActivity()
  if (res.code === 200 && res.data) {
    await syncFromServer()
    showToast('已有进行中的记录，请先结束后再开新的')
    return false
  }
  return true
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

async function finishCurrentSegment () {
  if (!session.value) return false
  if (!(await requireAuth())) return false
  if (saving.value) return false

  saving.value = true
  const current = { ...session.value }
  const now = new Date()
  const { minutes } = calcDurationFromStart(current.startedAt, now)
  const title = getRecordTitle(current.parentId, current.childId)
  const notes = buildRecordNotes(
    current.parentId,
    current.childId,
    summary.value,
    feelingRating.value,
    selectedTags.value
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
      useActivities().fetchActivities()
      showToast(`已结束 · ${title} · ${formatMinutes(minutes)}`)
      resetForm()
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
  } finally {
    saving.value = false
  }
}

async function handleStart (payload: { parent: LifeCard, child?: { id: string, label: string } }) {
  if (!(await requireAuth())) return
  if (saving.value) return
  if (hasSession.value) {
    showToast('请先结束当前进行中的记录')
    return
  }
  if (!(await assertNoOngoing())) return

  saving.value = true
  try {
    const ok = await createOngoingSegment(payload.parent, payload.child)
    if (ok) await navigateTo('/manage/time')
  } finally {
    saving.value = false
  }
}

async function confirmStart () {
  const payload = resolvePick()
  if (!payload) return
  await handleStart(payload)
}

async function confirmSwitch () {
  const payload = resolvePick()
  if (!payload) return

  const ok = await finishCurrentSegment()
  if (!ok) return

  saving.value = true
  try {
    const started = await createOngoingSegment(payload.parent, payload.child)
    if (started) await navigateTo('/manage/time')
  } finally {
    saving.value = false
  }
}

async function handleEndOnly () {
  const ok = await finishCurrentSegment()
  if (ok) await navigateTo('/manage/time')
}
</script>
