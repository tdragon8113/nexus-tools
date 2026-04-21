<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <nav class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage" class="hover:text-blue-600 transition-colors">管理台</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage/time" class="hover:text-blue-600 transition-colors">时间管理</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-900 font-medium">此刻时钟</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <van-icon name="clock-o" size="20" class="text-blue-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">此刻时钟</h1>
        </div>
      </header>

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
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'

definePageMeta({
  layout: false
})

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