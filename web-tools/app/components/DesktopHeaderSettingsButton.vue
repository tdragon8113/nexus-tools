<script setup lang="ts">
const { goSettings } = useDesktop()

const btnClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/80'
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
