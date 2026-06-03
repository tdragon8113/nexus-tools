<template>
  <div class="px-4 py-4 space-y-4">
    <AuthPrompt
      v-if="mounted && !authed"
      redirect="/manage/time"
    />

    <template v-else-if="mounted && authed">
      <div
        v-if="user"
        class="doc-surface px-4 py-2.5 flex items-center justify-between text-sm"
      >
        <span class="text-slate-600">已登录</span>
        <span class="font-medium text-slate-900 truncate max-w-[60%]">
          {{ user.nickname || user.username }}
        </span>
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
          @click="openSheet"
        >
          切换
        </van-button>
      </div>

      <div
        v-if="tagStats.length > 0"
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
        :activities="sortedActivities"
        :loading="loading"
        :list-title="listTitle"
        :empty-title="listEmptyTitle"
        :empty-hint="listEmptyHint"
        @delete="handleDelete"
        @edit="handleEditActivity"
      />
    </template>

    <RecordFab />
  </div>
</template>

<script setup lang="ts">
import { LIFE_CARD_COLORS } from '~/composables/useLifeCards'
import { useActiveSession } from '~/composables/useActiveSession'
import { compareActivityTime, formatDuration, isToday } from '~/utils/time'

useHead({ title: '记录 · Nexus Time' })

const { mounted, authed, user, sync: syncAuth } = useAuthSession()
const { activities, loading, tagStats, fetchActivities, removeActivity } = useActivities()
const {
  hasSession,
  load: loadSession,
  syncFromServer,
  sessionTitle,
  sessionCard,
  elapsedSeconds
} = useActiveSession()
const { load: loadLifeCards } = useLifeCards()

const elapsedLabel = computed(() => formatDuration(elapsedSeconds.value))

const dateLabel = computed(() => {
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 周${weekdays[now.getDay()]}`
})

const sortedActivities = computed(() =>
  [...activities.value].sort((a, b) => compareActivityTime(a.startTime, b.startTime))
)

const todayActivities = computed(() =>
  sortedActivities.value.filter(a => isToday(a.startTime))
)

const listTitle = computed(() => {
  const n = sortedActivities.value.length
  return n > 0 ? `全部记录（${n}）` : '我的记录'
})

const listEmptyTitle = computed(() => '还没有记录')
const listEmptyHint = computed(() => '点右下角 + 选择卡片开始')

const route = useRoute()
const router = useRouter()
const { openSheet } = useQuickSwitch()
const { preserveBackQuery } = useBackNavigation()

const { navigateWithBack } = useBackNavigation()

function openStartSheetFromQuery () {
  if (route.query.start !== '1' || !authed.value) return
  openSheet('start')
  const query = preserveBackQuery()
  void router.replace({ path: '/manage/time', query })
}

async function refreshPageData () {
  syncAuth()
  loadSession()
  if (authed.value) {
    await syncFromServer()
    await Promise.all([fetchActivities(), loadLifeCards()])
  }
  openStartSheetFromQuery()
}

async function handleDelete (id: number) {
  await removeActivity(id)
}

function handleEditActivity (id: number) {
  void navigateWithBack('/manage/time/edit', { id: String(id) })
}

onMounted(refreshPageData)

watch(authed, (loggedIn) => {
  if (loggedIn) {
    void syncFromServer()
    void fetchActivities()
    void loadLifeCards()
  }
})

const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    if (route.path === '/manage/time') {
      refreshPageData()
    } else if (route.query.start === '1') {
      openStartSheetFromQuery()
    }
  }
)
</script>
