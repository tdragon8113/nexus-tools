<script setup lang="ts">
import type { WorkbenchNavItem } from '~~/data/workbenchNav'
import { workbenchNavGroups } from '~~/data/workbenchNav'

const route = useRoute()

function isActiveItem (item: WorkbenchNavItem) {
  const p = route.path
  const path = item.to
  if (item.exact) {
    return p === path
  }
  if (item.prefix) {
    return p === path || p.startsWith(`${item.prefix}/`)
  }
  return p === path
}
</script>

<template>
  <aside
    class="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col border-r border-slate-200/90 bg-white/90 backdrop-blur-sm sticky top-[88px] self-start max-h-[calc(100vh-88px)] overflow-y-auto"
    aria-label="工作台导航"
  >
    <div class="py-4 px-3 space-y-6">
      <div v-for="group in workbenchNavGroups" :key="group.title">
        <p class="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {{ group.title }}
        </p>
        <nav class="space-y-0.5" :aria-label="group.title">
          <NuxtLink
            v-for="item in group.items"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
            :class="
              isActiveItem(item)
                ? 'bg-blue-500/10 text-blue-800 font-medium'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            "
          >
            <van-icon :name="item.icon" size="18" class="shrink-0 opacity-80" />
            <span class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>
    </div>
  </aside>
</template>
