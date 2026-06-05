<script setup lang="ts">
const { goSettings } = useDesktop()

const btnClass =
  'nexus-shell-settings-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors'
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
