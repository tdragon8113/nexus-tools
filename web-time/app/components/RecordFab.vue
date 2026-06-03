<template>
  <button
    type="button"
    class="record-fab fixed z-[2100] flex h-14 w-14 items-center justify-center rounded-full doc-cta-gradient shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
    :aria-label="hasSession ? '切换记录' : '开始记录'"
    @click="onFabClick"
  >
    <van-icon :name="hasSession ? 'exchange' : 'plus'" size="26" class="text-white" />
  </button>
</template>

<script setup lang="ts">
const { hasSession, load } = useActiveSession()
const { openSheet } = useQuickSwitch()

onMounted(load)

function onFabClick () {
  openSheet()
}
</script>

<style scoped>
.record-fab {
  right: 1rem;
  bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem);
}
</style>
