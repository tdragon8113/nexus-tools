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
  <nav
    class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1"
    aria-label="面包屑"
  >
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="hover:text-blue-600 transition-colors"
      >
        {{ item.label }}
      </NuxtLink>
      <span
        v-else
        :class="
          index === items.length - 1
            ? 'text-slate-900 font-medium'
            : 'text-slate-600'
        "
      >{{ item.label }}</span>
      <span
        v-if="index < items.length - 1"
        class="text-slate-300"
        aria-hidden="true"
      >
        /
      </span>
    </template>
  </nav>
</template>
