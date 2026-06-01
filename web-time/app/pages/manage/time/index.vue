<template>
  <div class="px-4 py-4 space-y-4">
    <div
      v-if="mounted && !authed"
      class="doc-surface p-4 flex items-start gap-3"
    >
      <van-icon name="info-o" size="20" class="text-indigo-500 shrink-0 mt-0.5" />
      <div class="min-w-0 flex-1">
        <p class="text-sm text-slate-700">登录后，你的生活记录会保存在云端</p>
        <NuxtLink
          to="/auth/login"
          class="inline-block mt-2 text-sm font-medium text-indigo-600"
        >
          去登录 →
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="hasSession"
      class="doc-surface p-4 flex items-center gap-3"
    >
      <div
        v-if="sessionCard"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        :class="LIFE_CARD_COLORS[sessionCard.color].bg"
      >
        <van-icon
          :name="sessionCard.icon"
          size="24"
          :class="LIFE_CARD_COLORS[sessionCard.color].text"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs text-indigo-600 font-medium">进行中</p>
        <p class="text-sm font-semibold text-slate-900 truncate">{{ sessionTitle }}</p>
        <p class="text-xs text-slate-500 mt-0.5 tabular-nums">{{ elapsedLabel }}</p>
      </div>
      <van-button
        size="small"
        type="primary"
        round
        class="!border-0 !bg-indigo-600 shrink-0"
        @click="navigateWithBack('/manage/time/edit')"
      >
        切换
      </van-button>
    </div>

    <div
      v-if="authed && tagStats.length > 0"
      class="doc-surface p-3 space-y-2"
    >
      <div
        class="flex items-center justify-between active:opacity-80"
        role="button"
        @click="navigateWithBack('/manage/time/tags')"
      >
        <p class="text-sm font-medium text-slate-900">标签</p>
        <span class="text-xs text-indigo-600 flex items-center gap-0.5">
          全部
          <van-icon name="arrow" size="12" />
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in tagStats.slice(0, 8)"
          :key="item.tag"
          type="button"
          class="rounded-full px-2.5 py-1 text-xs border border-slate-200 text-slate-600 active:bg-slate-50"
          @click="navigateWithBack('/manage/time/tags', { tag: item.tag })"
        >
          {{ item.tag }} · {{ item.count }}
        </button>
      </div>
    </div>

    <div class="doc-surface px-4 py-3 flex items-center justify-between">
      <div>
        <p class="text-xs text-slate-500">{{ dateLabel }}</p>
        <p class="text-sm font-medium text-slate-800 mt-0.5">留住生活的片段</p>
      </div>
      <div v-if="todayActivities.length > 0" class="text-right">
        <p class="text-2xl font-semibold text-indigo-600 tabular-nums">
          {{ todayActivities.length }}
        </p>
        <p class="text-[11px] text-slate-500">今日记录</p>
      </div>
    </div>

    <ActivityList
      :activities="todayActivities"
      :loading="loading"
      @delete="handleDelete"
    />

    <RecordFab />
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import type { Activity } from '~/composables/useWorkspaceApi'
import { LIFE_CARD_COLORS, parseRecordNotes } from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { formatDuration, isToday } from '~/utils/time'

useHead({ title: '记录 · Nexus Time' })

const { mounted, authed } = useClientAuthed()
const { getAccessToken } = useAuthApi()
const { getActivities, deleteActivity } = useWorkspaceApi()
const {
  hasSession,
  load: loadSession,
  sessionTitle,
  sessionCard,
  elapsedSeconds
} = useActiveSession()

const activities = ref<Activity[]>([])
const loading = ref(true)

const elapsedLabel = computed(() => formatDuration(elapsedSeconds.value))

const dateLabel = computed(() => {
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 周${weekdays[now.getDay()]}`
})

const todayActivities = computed(() =>
  activities.value
    .filter(a => isToday(a.startTime))
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
)

const tagStats = computed(() => {
  const counts = new Map<string, number>()
  for (const a of activities.value) {
    for (const tag of parseRecordNotes(a.notes).tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'))
})

const { navigateWithBack } = useBackNavigation()

async function loadActivities () {
  if (!getAccessToken()) {
    activities.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await getActivities()
    if (res.code === 200 && res.data) {
      activities.value = res.data
    }
  } finally {
    loading.value = false
  }
}

async function handleDelete (id: number) {
  const res = await deleteActivity(id)
  if (res.code === 200) {
    activities.value = activities.value.filter(a => a.id !== id)
    showToast('已删除')
  } else {
    showToast(res.message || '删除失败')
  }
}

onMounted(() => {
  loadSession()
  loadActivities()
})
</script>
