<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 左侧导航（如「搜索」「工具集」「返回」） */
    primaryLabel?: string
    /** 第二枚导航（工具页上的「工具集」） */
    secondaryLabel?: string
    /** 标题栏居中标题 */
    title: string
    /** 是否显示设置入口 */
    showSettings?: boolean
  }>(),
  { showSettings: true }
)

const emit = defineEmits<{
  primary: []
  secondary: []
}>()
</script>

<template>
  <header class="nexus-shell-header">
    <button
      v-if="props.primaryLabel"
      type="button"
      class="nexus-chrome-link"
      @click="emit('primary')"
    >
      {{ props.primaryLabel }}
    </button>
    <button
      v-if="props.secondaryLabel"
      type="button"
      class="nexus-chrome-link"
      @click="emit('secondary')"
    >
      {{ props.secondaryLabel }}
    </button>
    <span class="nexus-shell-drag-region min-w-0 flex-1 truncate text-center font-semibold">
      {{ props.title }}
    </span>
    <DesktopHeaderSettingsButton v-if="props.showSettings" />
    <DesktopWindowChrome />
  </header>
</template>
