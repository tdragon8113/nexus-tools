<template>
  <div class="px-4 py-4 space-y-4">
    <AuthPrompt
      v-if="mounted && !authed"
      message="登录后按标签查看记录"
      redirect="/manage/time/tags"
    />

    <template v-else-if="mounted && authed">
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
import { activityHasTag } from '~/composables/useLifeCards'

useHead({ title: '标签 · Nexus Time' })

const route = useRoute()
const router = useRouter()
const { preserveBackQuery } = useBackNavigation()
const { mounted, authed } = useAuthSession()
const { activities, loading, tagStats, fetchActivities, removeActivity } = useActivities()

const activeTag = computed(() => {
  const q = route.query.tag
  return typeof q === 'string' && q.trim() ? q.trim() : null
})

const filteredActivities = computed(() =>
  activities.value
    .filter(a => !activeTag.value || activityHasTag(a.notes, activeTag.value))
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
)

const listTitle = computed(() =>
  activeTag.value ? `「${activeTag.value}」` : '全部标签'
)

function selectTag (tag: string | null) {
  const query = preserveBackQuery(tag ? { tag } : undefined)
  void router.replace({ path: '/manage/time/tags', query })
}

async function handleDelete (id: number) {
  await removeActivity(id)
}

onMounted(fetchActivities)
</script>
