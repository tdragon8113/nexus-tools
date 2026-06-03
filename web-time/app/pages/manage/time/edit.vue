<template>
  <div class="px-4 py-4 space-y-4">
    <div
      v-if="mounted && !authed"
      class="doc-surface p-4 flex items-start gap-3"
    >
      <van-icon name="info-o" size="20" class="text-indigo-500 shrink-0 mt-0.5" />
      <p class="text-sm text-slate-700">登录后才能保存记录，可先体验选卡片</p>
    </div>

    <!-- 补写已结束记录 -->
    <template v-else-if="editActivityId != null && !editActivity && loadingActivities">
      <div class="doc-surface py-12 flex justify-center">
        <van-loading size="24px" />
      </div>
    </template>

    <template v-else-if="editActivityId != null && !editActivity">
      <div class="doc-surface p-6 text-center space-y-3">
        <p class="text-sm text-slate-600">找不到这条记录</p>
        <van-button round block plain @click="handleCancel">返回</van-button>
      </div>
    </template>

    <template v-else-if="editActivity">
      <div class="doc-surface p-4 space-y-1">
        <p class="text-xs text-slate-500">补写总结</p>
        <p class="text-base font-semibold text-slate-900">{{ editActivity.title }}</p>
        <p class="text-xs text-slate-500 tabular-nums">
          {{ formatTimeOfDay(editActivity.startTime) }}–{{ formatTimeOfDay(editActivity.endTime!) }}
          · {{ formatMinutes(editActivity.durationMinutes) }}
        </p>
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
      </div>

      <van-button
        round
        block
        type="primary"
        class="!border-0 !bg-indigo-600"
        :loading="saving"
        @click="saveEditedActivity"
      >
        保存
      </van-button>
    </template>

    <!-- 无进行中且无编辑目标：回首页用 Sheet 开始 -->
    <template v-else-if="!hasSession">
      <div class="doc-surface p-6 text-center space-y-3">
        <p class="text-sm text-slate-600">开始记录请返回首页，点右下角 + 选择卡片</p>
        <van-button round block type="primary" class="!border-0 !bg-indigo-600" @click="goStartFromHome">
          去开始记录
        </van-button>
      </div>
    </template>

    <!-- 有进行中：补写总结（切换请用首页 Sheet） -->
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
        <p class="text-xs text-slate-500 leading-relaxed">
          切换下一段请返回首页点「切换」或右下角 ⇄；这里仅补写当前段的总结与感受。
        </p>
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
      </div>

      <van-button
        round
        block
        type="primary"
        class="!border-0 !bg-indigo-600"
        :loading="saving"
        @click="saveOngoingNotes"
      >
        保存总结
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
  decodeCardMarker,
  LIFE_CARD_COLORS,
  parseRecordNotes,
  useLifeCards
} from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { useSegmentActions } from '~/composables/useSegmentActions'
import type { Activity } from '~/composables/useWorkspaceApi'
import { formatDuration, formatMinutes, formatTimeOfDay } from '~/utils/time'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { mounted, authed } = useAuthSession()
const { getAccessToken } = useAuthApi()
const { updateActivity } = useWorkspaceApi()
const { load } = useLifeCards()
const {
  session,
  hasSession,
  load: loadSession,
  syncFromServer,
  sessionTitle,
  sessionCard,
  elapsedSeconds
} = useActiveSession()
const { saving, endCurrentOnly } = useSegmentActions()
const { activities, fetchActivities, loading: loadingActivities } = useActivities()

const { linkWithBack, resolveBack } = useBackNavigation()

const summary = ref('')
const feelingRating = ref(3)
const selectedTags = ref<string[]>([])

const editActivityId = computed(() => {
  const raw = route.query.id
  if (typeof raw !== 'string' || !raw) return null
  const id = Number.parseInt(raw, 10)
  return Number.isFinite(id) ? id : null
})

const editActivity = computed<Activity | null>(() => {
  if (editActivityId.value == null) return null
  return activities.value.find(item => item.id === editActivityId.value) ?? null
})

const elapsedLabel = computed(() => formatDuration(elapsedSeconds.value))

const pageTitle = computed(() => {
  if (editActivity.value) return '补写总结 · Nexus Time'
  if (hasSession.value) return '写总结 · Nexus Time'
  return '写记录 · Nexus Time'
})

useHead(() => ({ title: pageTitle.value }))

function applyParsedNotes (notes: string | null) {
  const parsed = parseRecordNotes(notes)
  summary.value = parsed.summary ?? ''
  feelingRating.value = parsed.feelingRating ?? 3
  selectedTags.value = parsed.tags ?? []
}

onMounted(async () => {
  load()
  loadSession()
  if (getAccessToken()) {
    await fetchActivities()
    const ongoing = await syncFromServer()
    if (editActivity.value) {
      applyParsedNotes(editActivity.value.notes)
    } else if (ongoing?.notes) {
      applyParsedNotes(ongoing.notes)
    }
  }
})

watch(editActivity, (activity) => {
  if (activity) applyParsedNotes(activity.notes)
})

function handleCancel () {
  void navigateTo(resolveBack('/manage/time'))
}

function goStartFromHome () {
  void navigateTo('/manage/time?start=1')
}

async function requireAuth () {
  if (getAccessToken()) return true
  showToast('请先登录')
  await navigateTo('/auth/login?redirect=/manage/time/edit')
  return false
}

function buildNotesFromForm (parentId: string, childId?: string) {
  return buildRecordNotes(
    parentId,
    childId,
    summary.value,
    feelingRating.value,
    selectedTags.value
  )
}

async function saveOngoingNotes () {
  if (!session.value) return
  if (!(await requireAuth())) return
  if (saving.value) return

  saving.value = true
  try {
    const res = await updateActivity(session.value.activityId, {
      notes: buildNotesFromForm(session.value.parentId, session.value.childId)
    })
    if (res.code === 200) {
      showToast('已保存')
      await fetchActivities()
      return
    }
    showToast(res.message || '保存失败')
  } catch {
    showToast('网络错误，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function saveEditedActivity () {
  const activity = editActivity.value
  if (!activity) return
  if (!(await requireAuth())) return
  if (saving.value) return

  const marker = decodeCardMarker(activity.notes)
  if (!marker) {
    showToast('无法解析记录')
    return
  }

  saving.value = true
  try {
    const res = await updateActivity(activity.id, {
      notes: buildNotesFromForm(marker.parentId, marker.childId)
    })
    if (res.code === 200) {
      showToast('已保存')
      await fetchActivities()
      await navigateTo(resolveBack('/manage/time'))
      return
    }
    showToast(res.message || '保存失败')
  } catch {
    showToast('网络错误，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function handleEndOnly () {
  const ok = await endCurrentOnly({
    summary: summary.value,
    feelingRating: feelingRating.value,
    tags: selectedTags.value
  })
  if (ok) await navigateTo('/manage/time')
}
</script>
