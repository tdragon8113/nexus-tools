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
        <span class="text-slate-900 font-medium">番茄专注</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <van-icon name="fire-o" size="20" class="text-orange-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">番茄专注</h1>
        </div>
      </header>

      <section class="doc-surface rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-slate-500">经典番茄：25 分钟专注 + 5 分钟短休息。</p>
          <span
            class="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
            :class="pomodoroPhaseLabel.class"
          >
            {{ pomodoroPhaseLabel.text }}
          </span>
        </div>
        <div class="p-6 md:p-8 text-center">
          <p class="font-mono text-5xl sm:text-6xl font-medium text-slate-900 tabular-nums mb-8">
            {{ pomodoroDisplay }}
          </p>
          <div class="flex flex-wrap justify-center gap-2 mb-4">
            <van-button
              type="primary"
              class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !border-0"
              :disabled="pomodoro.running && pomodoro.phase === 'work'"
              @click="startPomodoroWork"
            >
              专注 25 分
            </van-button>
            <van-button
              type="primary"
              plain
              hairline
              class="!text-blue-700 !border-blue-200"
              :disabled="pomodoro.running && pomodoro.phase === 'break'"
              @click="startPomodoroBreak"
            >
              短休 5 分
            </van-button>
          </div>
          <div class="flex flex-wrap justify-center gap-2">
            <van-button v-if="!pomodoro.running" size="small" @click="resumePomodoro">
              继续
            </van-button>
            <van-button v-else size="small" @click="pausePomodoro">
              暂停
            </van-button>
            <van-button size="small" plain hairline type="danger" @click="resetPomodoro">
              重置
            </van-button>
          </div>
          <p v-if="pomodoro.phase === 'idle' && pomodoro.remaining === 0" class="mt-6 text-sm text-slate-500">
            选择一种时长开始，或使用「继续」恢复上次暂停。
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, computed, ref } from 'vue'
import { showToast } from 'vant'

definePageMeta({
  layout: false
})

useHead({
  title: '番茄专注 · 时间管理 - Nexus Tools'
})

const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60

const pomodoro = reactive({
  phase: 'idle' as 'idle' | 'work' | 'break',
  remaining: 0,
  running: false
})

let pomodoroTimer: ReturnType<typeof setInterval> | null = null

const pomodoroDisplay = computed(() => {
  const s = pomodoro.remaining
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
})

const pomodoroPhaseLabel = computed(() => {
  if (pomodoro.phase === 'work')
    return { text: '专注中', class: 'bg-blue-100 text-blue-800' }
  if (pomodoro.phase === 'break')
    return { text: '休息中', class: 'bg-emerald-100 text-emerald-800' }
  return { text: '待开始', class: 'bg-slate-100 text-slate-600' }
})

function clearPomodoroTick() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer)
    pomodoroTimer = null
  }
}

function tickPomodoro() {
  if (pomodoro.remaining <= 0) {
    clearPomodoroTick()
    pomodoro.running = false
    const was = pomodoro.phase
    pomodoro.phase = 'idle'
    pomodoro.remaining = 0
    if (was === 'work') showToast({ message: '专注时间结束，休息一下吧', position: 'top' })
    else if (was === 'break') showToast({ message: '休息结束，继续加油', position: 'top' })
    return
  }
  pomodoro.remaining -= 1
}

function startPomodoroWork() {
  clearPomodoroTick()
  pomodoro.phase = 'work'
  pomodoro.remaining = WORK_SEC
  pomodoro.running = true
  pomodoroTimer = setInterval(tickPomodoro, 1000)
}

function startPomodoroBreak() {
  clearPomodoroTick()
  pomodoro.phase = 'break'
  pomodoro.remaining = BREAK_SEC
  pomodoro.running = true
  pomodoroTimer = setInterval(tickPomodoro, 1000)
}

function pausePomodoro() {
  pomodoro.running = false
  clearPomodoroTick()
}

function resumePomodoro() {
  if (pomodoro.remaining <= 0 || pomodoro.phase === 'idle') {
    showToast('请先选择专注或短休')
    return
  }
  if (pomodoro.running) return
  pomodoro.running = true
  pomodoroTimer = setInterval(tickPomodoro, 1000)
}

function resetPomodoro() {
  clearPomodoroTick()
  pomodoro.phase = 'idle'
  pomodoro.remaining = 0
  pomodoro.running = false
}

onUnmounted(() => {
  if (pomodoroTimer) clearInterval(pomodoroTimer)
})
</script>