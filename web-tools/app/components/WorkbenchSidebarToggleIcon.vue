<script setup lang="ts">
withDefaults(
  defineProps<{
    /** true = 侧栏已收起，显示「展开」方向 */
    collapsed?: boolean
  }>(),
  { collapsed: false }
)
</script>

<template>
  <svg
    class="h-4 w-4 shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="16" height="1.5" rx="0.4" />
    <rect x="2" y="15.5" width="16" height="1.5" rx="0.4" />
    <template v-if="!collapsed">
      <path d="M3.25 10 L6.75 12.1 V7.9 Z" />
      <rect x="9" y="7.25" width="9" height="1.5" rx="0.4" />
      <rect x="9" y="11.25" width="9" height="1.5" rx="0.4" />
    </template>
    <template v-else>
      <path d="M16.75 10 L13.25 12.1 V7.9 Z" />
      <rect x="2" y="7.25" width="9" height="1.5" rx="0.4" />
      <rect x="2" y="11.25" width="9" height="1.5" rx="0.4" />
    </template>
  </svg>
</template>
