<template>
  <div class="desktop-tool-page flex h-full min-h-0 flex-col">
<section
      class="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 space-y-2"
      aria-label="当前时间"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-medium text-slate-800">当前时间</span>
        <button
          type="button"
          class="text-xs text-orange-700 hover:underline"
          @click="refreshNow"
        >
          刷新
        </button>
      </div>
      <div class="grid sm:grid-cols-2 gap-2 font-mono text-xs">
        <div>
          <span class="text-slate-500">毫秒</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="tabular-nums">{{ nowMs }}</span>
            <button type="button" class="text-orange-600 text-[11px] hover:underline" @click="copyWithToast(String(nowMs))">
              复制
            </button>
          </div>
        </div>
        <div>
          <span class="text-slate-500">秒</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="tabular-nums">{{ nowSec }}</span>
            <button type="button" class="text-orange-600 text-[11px] hover:underline" @click="copyWithToast(String(nowSec))">
              复制
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="space-y-4">
      <label class="block">
        <span class="block text-xs font-medium text-slate-600 mb-1">时间戳、ISO 日期或粘贴识别</span>
        <textarea
          v-model="input"
          class="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono"
          placeholder="例如 1717000000、1717000000000 或 2024-05-15T12:00:00…"
          spellcheck="false"
        />
      </label>

      <p v-if="parseError" class="text-sm text-red-600" role="alert">
        {{ parseError }}
      </p>

      <div
        v-else-if="formatted"
        class="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-2"
      >
        <div class="grid gap-2 sm:grid-cols-2">
          <div>
            <span class="text-xs text-slate-500">毫秒</span>
            <p class="font-mono tabular-nums">{{ formatted.ms }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500">秒</span>
            <p class="font-mono tabular-nums">{{ formatted.sec }}</p>
          </div>
        </div>
        <div>
          <span class="text-xs text-slate-500">本地时间</span>
          <p class="font-mono text-xs break-words mt-0.5">{{ formatted.local }}</p>
        </div>
        <div>
          <span class="text-xs text-slate-500">ISO（UTC）</span>
          <p class="font-mono text-xs break-words mt-0.5">{{ formatted.isoUtc }}</p>
        </div>
        <button
          type="button"
          class="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          @click="copyWithToast(String(formatted.ms))"
        >
          复制毫秒时间戳
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          @click="useNowMs"
        >
          填入当前毫秒
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          @click="useNowSec"
        >
          填入当前秒
        </button>
        <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="input = ''">
          清空
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseTimestampFlexible } from '~~/utils/timestampParse'

useHead({ title: '时间戳 - Nexus Tools' })

const input = ref('')

useConsumeToolPrefill('timestamp', (text) => {
  input.value = text
})
const nowMs = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const refreshNow = () => {
  nowMs.value = Date.now()
}

const nowSec = computed(() => Math.floor(nowMs.value / 1000))

const parsed = computed(() => {
  const t = input.value.trim()
  if (!t) return null
  return parseTimestampFlexible(t)
})

const parseError = computed(() => {
  const t = input.value.trim()
  if (!t) return ''
  const r = parseTimestampFlexible(t)
  return r.ok ? '' : r.error
})

const formatted = computed(() => {
  if (!parsed.value?.ok) return null
  const ms = parsed.value.ms
  const d = new Date(ms)
  return {
    ms,
    sec: Math.floor(ms / 1000),
    local: d.toString(),
    isoUtc: d.toISOString()
  }
})

const useNowMs = () => {
  refreshNow()
  input.value = String(nowMs.value)
}

const useNowSec = () => {
  refreshNow()
  input.value = String(nowSec.value)
}

onMounted(() => {
  refreshNow()
  timer = setInterval(refreshNow, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
