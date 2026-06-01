<template>
  <button
    type="button"
    class="record-fab fixed z-[2100] flex h-14 w-14 items-center justify-center rounded-full doc-cta-gradient shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
    :aria-label="hasSession ? '切换记录' : '开始记录'"
    @click="goEdit"
  >
    <van-icon :name="hasSession ? 'exchange' : 'plus'" size="26" class="text-white" />
  </button>
</template>

<script setup lang="ts">
const { hasSession, load } = useActiveSession()
const { navigateWithBack } = useBackNavigation()

onMounted(load)

function goEdit () {
  void navigateWithBack('/manage/time/edit')
}
</script>

<style scoped>
.record-fab {
  right: 1rem;
  bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem);
}
</style>
