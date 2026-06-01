<template>
  <div class="px-4 py-4 space-y-4">
    <AuthPrompt
      v-if="mounted && !authed"
      message="登录后查看带总结与感受的生活记录"
      redirect="/manage/time/insights"
    />

    <template v-else-if="mounted && authed">
      <p class="text-sm text-slate-600 leading-relaxed px-0.5">
        来自你在「写记录」里填写的总结与感受，与生活记录一起构成回顾。
      </p>

      <div v-if="loading" class="flex justify-center py-16">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>

      <div v-else-if="insights.length === 0" class="doc-surface p-8 text-center">
        <van-icon name="comment-o" size="40" class="text-slate-300 mx-auto mb-4" />
        <p class="text-slate-700 font-medium">还没有感悟</p>
        <p class="text-sm text-slate-500 mt-2 leading-relaxed">
          结束一段记录时写下总结或感受，会出现在这里。
        </p>
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="item in insights"
          :key="item.id"
          class="doc-surface p-4 space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <h2 class="text-sm font-semibold text-slate-900">{{ item.title }}</h2>
            <time class="text-[11px] text-slate-400 shrink-0 tabular-nums">{{ item.dateLabel }}</time>
          </div>
          <p v-if="item.feeling" class="text-xs text-indigo-600">{{ item.feeling }}</p>
          <p v-if="item.summary" class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {{ item.summary }}
          </p>
          <div v-if="item.tags?.length" class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="rounded-full px-2 py-0.5 text-[11px] border border-slate-200 text-slate-500"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatFeelingDisplay, parseRecordNotes } from '~/composables/useLifeCards'

useHead({ title: '感悟 · Nexus Time' })

const { mounted, authed, sync: syncAuth } = useAuthSession()
const { activities, loading, fetchActivities } = useActivities()

const insights = computed(() =>
  activities.value
    .map((activity) => {
      const parsed = parseRecordNotes(activity.notes)
      const summary = parsed.summary?.trim()
      const feeling = formatFeelingDisplay(parsed)
      if (!summary && !feeling) return null

      const start = new Date(activity.startTime)
      return {
        id: activity.id,
        title: activity.title,
        summary,
        feeling: feeling || undefined,
        tags: parsed.tags,
        dateLabel: Number.isNaN(start.getTime())
          ? ''
          : `${start.getMonth() + 1}/${start.getDate()}`
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => b.id - a.id)
)

onMounted(async () => {
  syncAuth()
  if (authed.value) {
    await fetchActivities()
  }
})

watch(authed, (loggedIn) => {
  if (loggedIn) void fetchActivities()
})
</script>
