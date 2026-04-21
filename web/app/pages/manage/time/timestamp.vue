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
        <span class="text-slate-900 font-medium">时间戳互转</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <van-icon name="exchange" size="20" class="text-emerald-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">时间戳互转</h1>
        </div>
      </header>

      <section class="doc-surface rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
          <p class="text-sm text-slate-500">在 Unix 时间与本地日期时间之间换算。</p>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

definePageMeta({
  layout: false
})

useHead({
  title: '时间戳互转 · 时间管理 - Nexus Tools'
})

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
  tsRaw.value = tsUnit.value === 's' ? String(Math.floor(ms / 1000)) : String(ms)
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
</script>