<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  /** 最后一项通常不传 to，仅作文本 */
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
