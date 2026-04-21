<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <nav class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage" class="hover:text-blue-600 transition-colors">管理台</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-900 font-medium">时间管理</span>
      </nav>

      <header class="mb-8 pb-8 border-b border-slate-200/80">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            class="w-12 h-12 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-100"
          >
            <van-icon name="notes-o" size="24" class="text-indigo-600" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600/90 mb-2">管理台 · 时间管理</p>
            <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              时间管理
            </h1>
            <p class="mt-2 doc-prose-muted text-base max-w-2xl">
              本模块独立于「小工具」列表，方便后续扩展复杂能力。当前提供时钟、时间戳互转与番茄钟；数据仅在浏览器内处理。
            </p>
          </div>
        </div>
      </header>

      <!-- 当前时间 -->
      <section class="doc-surface rounded-2xl p-6 md:p-8 mb-8">
        <h2 class="font-display text-lg font-semibold text-slate-900 mb-4">此刻</h2>
        <p class="font-mono text-3xl sm:text-4xl md:text-5xl font-medium text-slate-900 tabular-nums tracking-tight">
          {{ clock.time }}
        </p>
        <p class="mt-2 text-slate-600 text-sm sm:text-base">
          {{ clock.date }} · {{ clock.weekday }}
        </p>
        <p class="mt-1 text-xs text-slate-400 font-mono">
          时区：{{ clock.timeZone }}
        </p>
      </section>

      <!-- 时间戳互转 -->
      <section class="doc-surface rounded-2xl overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
          <h2 class="font-display text-lg font-semibold text-slate-900">时间戳互转</h2>
          <p class="text-sm text-slate-500 mt-1">在 Unix 时间与本地日期时间之间换算。</p>
        </div>
        <div class="p-5 md:p-6 space-y-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm text-slate-600">时间戳单位</span>
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md transition-colors"
                :class="tsUnit === 's' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-600'"
                @click="tsUnit = 's'"
              >
                秒
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md transition-colors"
                :class="tsUnit === 'ms' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-600'"
                @click="tsUnit = 'ms'"
              >
                毫秒
              </button>
            </div>
            <button
              type="button"
              class="text-sm text-blue-600 hover:underline"
              @click="applyNowToTimestamp"
            >
              填入当前时间
            </button>
          </div>

          <div class="grid md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Unix 时间戳</label>
              <input
                v-model="tsRaw"
                type="text"
                inputmode="numeric"
                class="w-full rounded-xl border border-slate-200 bg-[var(--doc-code-bg)] px-4 py-3 font-mono text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="例如 1713600000"
                @input="onTimestampInput"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">本地日期时间</label>
              <input
                v-model="datetimeLocal"
                type="datetime-local"
                step="1"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                @input="onDatetimeLocalInput"
              />
            </div>
          </div>
          <p v-if="tsError" class="text-sm text-red-600">{{ tsError }}</p>
        </div>
      </section>

      <!-- 番茄钟 -->
      <section class="doc-surface rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-slate-900">专注计时</h2>
            <p class="text-sm text-slate-500 mt-1">经典番茄：25 分钟专注 + 5 分钟短休息。</p>
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
            :class="pomodoroPhaseLabel.class"
          >
            {{ pomodoroPhaseLabel.text }}
          </span>
        </div>
        <div class="p-6 md:p-8 text-center">
          <p class="font-mono text-5xl sm:text-6xl md:text-7xl font-medium text-slate-900 tabular-nums mb-8">
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

      <section class="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 md:p-6">
        <h2 class="font-display text-base font-semibold text-indigo-900 mb-3">说明</h2>
        <ul class="text-sm text-indigo-900/85 space-y-2 list-disc pl-5 marker:text-indigo-400">
          <li>本页属于管理台模块，与首页轻量工具分离，便于后续增加多页面、子路由与更复杂状态。</li>
          <li>时钟与计时器依赖本机时间；切换标签页后计时仍会进行。</li>
          <li>时间戳按本地时区解析；<code class="font-mono text-xs bg-indigo-100/80 px-1 rounded">datetime-local</code> 与浏览器时区一致。</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue'
import { showToast } from 'vant'

definePageMeta({
  layout: false
})

useHead({
  title: '时间管理 · 管理台 - Nexus Tools'
})

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const clock = reactive({
  time: '',
  date: '',
  weekday: '',
  timeZone: ''
})

let clockTimer: ReturnType<typeof setInterval> | null = null
let pomodoroTimer: ReturnType<typeof setInterval> | null = null

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

/* —— 时间戳 —— */
const tsUnit = ref<'s' | 'ms'>('ms')
const tsRaw = ref('')
const datetimeLocal = ref('')
const tsError = ref('')

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function onTimestampInput() {
  tsError.value = ''
  const raw = tsRaw.value.trim()
  if (!raw) {
    datetimeLocal.value = ''
    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    tsError.value = '请输入有效数字'
    return
  }
  const ms = tsUnit.value === 's' ? Math.round(n * 1000) : Math.round(n)
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) {
    tsError.value = '无法解析该时间戳'
    return
  }
  datetimeLocal.value = toDatetimeLocalValue(d)
}

function onDatetimeLocalInput() {
  tsError.value = ''
  const v = datetimeLocal.value
  if (!v) {
    tsRaw.value = ''
    return
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) {
    tsError.value = '日期格式无效'
    return
  }
  const ms = d.getTime()
  tsRaw.value =
    tsUnit.value === 's' ? String(Math.floor(ms / 1000)) : String(ms)
}

function applyNowToTimestamp() {
  tsError.value = ''
  const ms = Date.now()
  tsRaw.value = tsUnit.value === 's' ? String(Math.floor(ms / 1000)) : String(ms)
  datetimeLocal.value = toDatetimeLocalValue(new Date(ms))
}

watch(tsUnit, () => {
  if (!tsRaw.value.trim()) return
  const n = Number(tsRaw.value.trim())
  if (!Number.isFinite(n)) return
  if (tsUnit.value === 's') {
    tsRaw.value = String(Math.floor(n / 1000))
  } else {
    tsRaw.value = String(n * 1000)
  }
})

/* —— 番茄钟 —— */
const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60

const pomodoro = reactive({
  phase: 'idle' as 'idle' | 'work' | 'break',
  remaining: 0,
  running: false
})

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

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pomodoroTimer) clearInterval(pomodoroTimer)
})
</script>
