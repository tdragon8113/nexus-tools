<script setup lang="ts">
import { showToast } from 'vant'

const {
  supported,
  loaded,
  trusted,
  required,
  appName,
  requesting,
  refresh,
  authorize,
  bindWindowFocusRefresh
} = useTotpAccessibility()

bindWindowFocusRefresh(() => true)

onMounted(() => {
  void refresh()
})

async function onAuthorize() {
  const result = await authorize()
  if (!result) return
  if (result.trusted) {
    showToast('已授权')
    return
  }
  if (result.openedSettings) {
    showToast(`请在系统设置中开启 ${result.appName}`)
    return
  }
}

const statusLabel = computed(() => {
  if (!required.value) return '无需授权'
  if (!loaded.value) return '检测中…'
  return trusted.value ? '已授权' : '未授权'
})

const statusClass = computed(() => {
  if (!required.value) return 'text-slate-500'
  if (!loaded.value) return 'text-slate-400'
  return trusted.value ? 'text-emerald-700' : 'text-amber-700'
})
</script>

<template>
  <div v-if="!supported" class="py-1 text-[13px] text-slate-400">仅桌面版可用</div>
  <div v-else-if="!loaded" class="py-1 text-[13px] text-slate-400">加载中…</div>
  <div v-else class="flex w-full flex-wrap items-center justify-end gap-2 sm:max-w-[360px]">
    <span class="text-[13px] font-medium tabular-nums" :class="statusClass">{{ statusLabel }}</span>
    <button
      v-if="required && !trusted"
      type="button"
      class="inline-flex h-7 shrink-0 items-center justify-center rounded-[6px] border border-amber-200/90 bg-amber-50 px-2.5 text-[12px] font-medium leading-none text-amber-900 transition-colors hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-45"
      :disabled="requesting"
      @click="onAuthorize"
    >
      {{ requesting ? '请求中…' : '去授权' }}
    </button>
    <button
      v-else-if="required && trusted"
      type="button"
      class="inline-flex h-7 shrink-0 items-center justify-center rounded-[6px] border border-slate-200/90 bg-white px-2.5 text-[12px] font-medium leading-none text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      @click="refresh"
    >
      刷新
    </button>
  </div>
</template>
