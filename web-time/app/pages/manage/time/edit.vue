<template>
  <div class="px-4 py-4 space-y-4">
    <div
      v-if="mounted && !authed"
      class="doc-surface p-4 flex items-start gap-3"
    >
      <van-icon name="info-o" size="20" class="text-indigo-500 shrink-0 mt-0.5" />
      <p class="text-sm text-slate-700">登录后才能保存记录，可先体验选卡片</p>
    </div>

    <!-- 首次：选第一张卡片开始计时 -->
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

    <!-- 切换：回顾上一段 + 选下一张 -->
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
            <p class="text-xs text-slate-500">上一段</p>
            <p class="text-base font-semibold text-slate-900">{{ sessionTitle }}</p>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ formatTimeOfDay(session!.startedAt) }} 起 · 已持续
            </p>
          </div>
          <p class="text-xl font-semibold text-indigo-600 tabular-nums shrink-0">
            {{ elapsedLabel }}
          </p>
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
        保存并继续
      </van-button>

      <van-button
        round
        block
        plain
        type="default"
        :loading="saving"
        @click="handleEndOnly"
      >
        保存并结束（不继续下一段）
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
  LIFE_CARD_COLORS,
  type LifeCard,
  useLifeCards
} from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { calcDurationFromStart, formatDuration, formatMinutes, formatTimeOfDay, toLocalIso } from '~/utils/time'

definePageMeta({
  layout: 'default'
})

useHead({ title: '写记录 · Nexus Time' })

const { mounted, authed } = useClientAuthed()
const { getAccessToken } = useAuthApi()
const { createActivity } = useWorkspaceApi()
const { load, getRecordTitle, getCard, getChild } = useLifeCards()
const {
  session,
  hasSession,
  load: loadSession,
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

onMounted(() => {
  load()
  loadSession()
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
  await navigateTo('/auth/login')
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

async function handleStart (payload: { parent: LifeCard; child?: { id: string; label: string } }) {
  if (!(await requireAuth())) return
  if (saving.value) return

  const { parent, child } = payload
  startSession(parent.id, child?.id)
  const title = getRecordTitle(parent.id, child?.id)
  showToast(`已开始 · ${title}`)
  await navigateTo('/manage/time')
}

async function saveCurrentSegment (endSession: boolean) {
  if (!session.value) return false
  if (!(await requireAuth())) return false
  if (saving.value) return false

  saving.value = true
  const current = session.value
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
    const res = await createActivity({
      title,
      category: sessionCard.value?.category ?? 'other',
      startTime: current.startedAt,
      endTime: toLocalIso(now),
      durationMinutes: minutes,
      notes
    })

    if (res.code === 200) {
      if (endSession) clearSession()
      showToast(`已记录 · ${title} · ${formatMinutes(minutes)}`)
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

async function confirmStart () {
  const payload = resolvePick()
  if (!payload) return
  await handleStart(payload)
}

async function confirmSwitch () {
  const payload = resolvePick()
  if (!payload) return
  await handleSwitch(payload)
}

async function handleSwitch (payload: { parent: LifeCard; child?: { id: string; label: string } }) {
  const ok = await saveCurrentSegment(false)
  if (!ok) return

  const { parent, child } = payload
  startSession(parent.id, child?.id)
  const nextTitle = getRecordTitle(parent.id, child?.id)
  showToast(`下一段 · ${nextTitle}`)
  await navigateTo('/manage/time')
}

async function handleEndOnly () {
  const ok = await saveCurrentSegment(true)
  if (ok) await navigateTo('/manage/time')
}
</script>
