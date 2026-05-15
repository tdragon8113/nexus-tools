<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { to: '/manage/time', label: '概览' },
        { label: '此刻时钟' }
      ]"
    />

    <PageHero compact title="此刻时钟">
      <template #icon>
        <div class="w-10 h-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <van-icon name="clock-o" size="20" class="text-blue-600" />
        </div>
      </template>
    </PageHero>

    <section class="doc-surface rounded-2xl p-6 md:p-8 text-center">
        <p class="font-mono text-4xl sm:text-5xl md:text-6xl font-medium text-slate-900 tabular-nums tracking-tight">
          {{ clock.time }}
        </p>
        <p class="mt-3 text-slate-600 text-base sm:text-lg">
          {{ clock.date }} · {{ clock.weekday }}
        </p>
        <p class="mt-2 text-xs text-slate-400 font-mono">
          时区：{{ clock.timeZone }}
        </p>
      </section>

      <section class="mt-6 doc-surface rounded-xl p-4">
        <p class="text-sm text-slate-600">
          本时钟依赖本机时间，每秒自动刷新。
        </p>
      </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'

useHead({
  title: '此刻时钟 · 时间管理 - Nexus Tools'
})

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const clock = reactive({
  time: '',
  date: '',
  weekday: '',
  timeZone: ''
})

let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clock.time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  clock.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  clock.weekday = WEEKDAYS[d.getDay()]
  try {
    clock.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    clock.timeZone = '本地'
  }
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>