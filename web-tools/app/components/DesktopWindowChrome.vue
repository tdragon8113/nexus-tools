<script setup lang="ts">
const { pinned, togglePin, closeDesktop, hasElectronBridge } = useDesktop()

const chromeBtn =
  'desktop-chrome-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700'

async function onPinDown() {
  await togglePin()
}
</script>

<template>
  <template v-if="hasElectronBridge">
    <button
      type="button"
      :class="[chromeBtn, pinned && '!text-indigo-600 hover:!bg-indigo-50']"
      style="-webkit-app-region: no-drag"
      :aria-label="pinned ? '取消固定' : '固定窗口'"
      :aria-pressed="pinned"
      :title="pinned ? '已固定' : '固定窗口'"
      @mousedown.prevent.stop="onPinDown"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 17v5" />
        <path d="M9 3h6l1 7H8l1-7z" :fill="pinned ? 'currentColor' : 'none'" />
      </svg>
    </button>
    <button
      type="button"
      :class="chromeBtn"
      style="-webkit-app-region: no-drag"
      aria-label="关闭"
      title="关闭"
      @click="closeDesktop"
    >
      <span class="text-sm leading-none" aria-hidden="true">✕</span>
    </button>
  </template>
</template>
