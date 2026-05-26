<script setup lang="ts">
definePageMeta({
  layout: 'desktop',
  desktopPanelScroll: true
})

useHead({ title: '设置 - Nexus Tools' })
</script>

<template>
  <div class="desktop-settings-page mx-auto w-full max-w-lg space-y-4">
    <DesktopClipboardSettings />
  </div>
</template>
