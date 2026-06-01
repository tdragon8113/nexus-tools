<template>
  <div class="px-4 py-4 space-y-4">
    <AuthPrompt
      v-if="mounted && !authed"
      message="登录后查看生活回顾"
      redirect="/manage/time/stats"
    />

    <template v-else-if="mounted && authed">
      <div v-if="loading" class="flex justify-center py-16">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>

      <template v-else-if="stats">
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="doc-surface p-3 text-center"
          >
            <p class="text-xl font-semibold tabular-nums" :class="card.color">
              {{ card.value }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1">{{ card.label }}</p>
          </div>
        </div>

        <section class="doc-surface p-4">
          <h2 class="font-sans text-sm font-semibold text-slate-900 mb-1">记录习惯</h2>
          <p class="text-xs text-slate-500 mb-4">你常在什么时段写下生活</p>
          <div class="flex items-end gap-1 h-28">
            <div
              v-for="hour in hourlyBars"
              :key="hour.label"
              class="flex-1 flex flex-col items-center gap-1 min-w-0"
            >
              <div
                class="w-full rounded-t bg-indigo-400/80 transition-all"
                :style="{ height: `${hour.percent}%`, minHeight: hour.count > 0 ? '4px' : '0' }"
                :title="`${hour.label}:00 · ${hour.count} 条`"
              />
              <span
                v-if="hour.showLabel"
                class="text-[9px] text-slate-400 tabular-nums"
              >
                {{ hour.label }}
              </span>
            </div>
          </div>
        </section>

        <section class="doc-surface overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
            <h2 class="font-sans text-sm font-semibold text-slate-900">近 30 日</h2>
          </div>
          <div v-if="dailyRows.length === 0" class="py-8 text-center text-sm text-slate-500">
            还没有记录，去写第一条吧
          </div>
          <van-cell-group v-else :border="false">
            <van-cell
              v-for="row in dailyRows"
              :key="row.date"
              :title="row.label"
              :value="`${row.count} 条`"
            />
          </van-cell-group>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Stats } from '~/composables/useWorkspaceApi'

useHead({ title: '回顾 · Nexus Time' })

const { mounted, authed } = useAuthSession()
const { getStats } = useWorkspaceApi()
const loading = ref(true)
const stats = ref<Stats | null>(null)

const summaryCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: '今日', value: stats.value.todayMinutes, color: 'text-indigo-600' },
    { label: '本周', value: stats.value.weekMinutes, color: 'text-purple-600' },
    { label: '累计', value: stats.value.totalSessions, color: 'text-slate-800' }
  ]
})

const hourlyBars = computed(() => {
  if (!stats.value) return []
  const dist = stats.value.hourlyDistribution ?? {}
  const max = Math.max(1, ...Object.values(dist))
  return Array.from({ length: 24 }, (_, i) => {
    const label = String(i).padStart(2, '0')
    const count = dist[label] ?? 0
    return {
      label,
      count,
      percent: Math.round((count / max) * 100),
      showLabel: i % 4 === 0
    }
  })
})

const dailyRows = computed(() => {
  if (!stats.value) return []
  const dist = stats.value.dailyDistribution ?? {}
  return Object.entries(dist)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14)
    .map(([date, count]) => ({
      date,
      count,
      label: formatDailyLabel(date)
    }))
})

function formatDailyLabel (isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(async () => {
  if (!authed.value) {
    loading.value = false
    return
  }
  try {
    const res = await getStats()
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } finally {
    loading.value = false
  }
})
</script>
