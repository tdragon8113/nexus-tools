<script setup lang="ts">
const { preference, loaded, themeOptions, syncFromMain, setPreference } = useDesktopTheme()

onMounted(() => {
  void syncFromMain()
})
</script>

<template>
  <div v-if="!loaded" class="py-1 text-[13px] text-slate-400">加载中…</div>
  <DesktopSettingsPopup
    v-else
    :model-value="preference"
    :options="themeOptions"
    @update:model-value="setPreference"
  />
</template>
