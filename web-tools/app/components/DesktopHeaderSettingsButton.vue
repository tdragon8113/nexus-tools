<script setup lang="ts">
const { goSettings } = useDesktop()

const btnClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600'
</script>

<template>
  <button
    type="button"
    :class="btnClass"
    style="-webkit-app-region: no-drag"
    aria-label="设置"
    title="设置"
    @mousedown.prevent="goSettings"
  >
    <van-icon name="setting-o" size="16" />
  </button>
</template>
