<template>
  <div class="px-4 py-4 space-y-4">
    <div v-if="!authed" class="doc-surface p-8 text-center">
      <van-icon name="label-o" size="40" class="text-slate-300 mx-auto mb-4" />
      <p class="text-slate-700 font-medium">登录后按标签查看记录</p>
      <NuxtLink
        to="/auth/login"
        class="inline-flex mt-5 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium doc-cta-gradient"
      >
        登录
      </NuxtLink>
    </div>

    <template v-else>
      <p class="text-sm text-slate-600 leading-relaxed px-0.5">
        点标签筛选记录。写记录时可给每段打上标签，方便日后回看。
      </p>

      <div v-if="tagStats.length > 0" class="doc-surface p-3">
        <p class="text-xs font-medium text-slate-500 mb-2 px-0.5">全部标签</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
            :class="!activeTag
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 text-slate-600'"
            @click="selectTag(null)"
          >
            全部
          </button>
          <button
            v-for="item in tagStats"
            :key="item.tag"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
            :class="activeTag === item.tag
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 text-slate-600'"
            @click="selectTag(item.tag)"
          >
            {{ item.tag }} · {{ item.count }}
          </button>
        </div>
      </div>

      <ActivityList
        :activities="filteredActivities"
        :loading="loading"
        :list-title="listTitle"
        empty-title="没有匹配的记录"
        empty-hint="切换记录时添加标签，或换一个标签看看"
        empty-icon="label-o"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import type { Activity } from '~/composables/useWorkspaceApi'
import { activityHasTag, parseRecordNotes } from '~/composables/useLifeCards'

useHead({ title: '标签 · Nexus Time' })

const route = useRoute()
const router = useRouter()
const { preserveBackQuery } = useBackNavigation()
const { authed } = useClientAuthed()
const { getAccessToken } = useAuthApi()
const { getActivities, deleteActivity } = useWorkspaceApi()

const activities = ref<Activity[]>([])
const loading = ref(true)

const activeTag = computed(() => {
  const q = route.query.tag
  return typeof q === 'string' && q.trim() ? q.trim() : null
})

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

const filteredActivities = computed(() => {
  const list = activities.value
    .filter(a => !activeTag.value || activityHasTag(a.notes, activeTag.value))
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
  return list
})

const listTitle = computed(() =>
  activeTag.value ? `「${activeTag.value}」` : '全部标签'
)

function selectTag (tag: string | null) {
  const query = preserveBackQuery(tag ? { tag } : undefined)
  void router.replace({ path: '/manage/time/tags', query })
}

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

onMounted(loadActivities)
</script>
