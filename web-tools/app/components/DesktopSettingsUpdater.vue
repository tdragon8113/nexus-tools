<script setup lang="ts">
const {
  updateState,
  loaded,
  checking,
  downloading,
  statusText,
  canInstall,
  canDownload,
  showManualRelease,
  bindUpdateListener,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  openReleasePage
} = useDesktopUpdater()

const actionBtn =
  'inline-flex h-7 shrink-0 items-center justify-center rounded-[6px] border px-2.5 text-[12px] font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-45'
const actionBtnDefault = `${actionBtn} border-slate-200/90 bg-white text-slate-700 shadow-sm hover:bg-slate-50`
const actionBtnPrimary = `${actionBtn} border-indigo-200/90 bg-indigo-50 text-indigo-800 hover:bg-indigo-100`
const actionBtnSuccess = `${actionBtn} border-emerald-200/90 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`

const compactStatus = computed(() => {
  const s = updateState.value
  if (s.status === 'downloaded' && s.manualInstallRecommended) {
    return '请手动安装'
  }
  if (s.status === 'error') {
    return statusText.value
  }
  const text = statusText.value
  if (text === '尚未检查') return ''
  return text
})

onMounted(() => {
  const off = bindUpdateListener()
  onUnmounted(() => off())
})
</script>

<template>
  <div v-if="!loaded" class="text-[13px] text-slate-400">加载中…</div>
  <div
    v-else
    class="flex min-h-[31px] w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1"
  >
    <span class="shrink-0 text-[13px] font-medium tabular-nums text-slate-900">
      v{{ updateState.currentVersion }}
    </span>
    <span
      v-if="compactStatus"
      class="max-w-[9.5rem] shrink truncate text-[12px] text-slate-500"
      :title="statusText"
    >
      {{ compactStatus }}
    </span>
    <button
      type="button"
      :class="actionBtnDefault"
      :disabled="checking || downloading"
      @click="checkForUpdates"
    >
      检查更新
    </button>
    <button
      v-if="canDownload"
      type="button"
      :class="actionBtnPrimary"
      :disabled="downloading"
      @click="downloadUpdate"
    >
      下载
    </button>
    <button v-if="canInstall" type="button" :class="actionBtnSuccess" @click="installUpdate">
      {{ updateState.manualInstallRecommended ? '打开下载页' : '安装' }}
    </button>
    <button v-if="showManualRelease" type="button" :class="actionBtnDefault" @click="openReleasePage">
      下载页
    </button>
  </div>
</template>
