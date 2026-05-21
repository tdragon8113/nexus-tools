<script setup lang="ts">
import type { WorkbenchNavItem } from '~~/data/workbenchNav'
import { workbenchNavGroups } from '~~/data/workbenchNav'

const route = useRoute()
const { openPath } = useWorkbenchTabs()
const { collapsed, toggle } = useWorkbenchSidebar()

interface HoverTip {
  text: string
  top: number
  left: number
}

const hoverTip = ref<HoverTip | null>(null)

function isActiveItem(item: WorkbenchNavItem) {
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

function showHoverTip(target: EventTarget | null, text: string) {
  if (!collapsed.value || !target || !(target instanceof HTMLElement)) return
  const rect = target.getBoundingClientRect()
  hoverTip.value = {
    text,
    top: rect.top + rect.height / 2,
    left: rect.right + 10
  }
}

function hideHoverTip() {
  hoverTip.value = null
}

watch(collapsed, () => {
  hideHoverTip()
})

watch(() => route.path, () => {
  hideHoverTip()
})
</script>

<template>
  <aside
    class="workbench-sidebar sticky top-14 z-40 flex shrink-0 flex-col self-start overflow-hidden border-r border-slate-200/90 bg-white/90 backdrop-blur-sm transition-[width] duration-200 ease-out max-h-[calc(100vh-3.5rem)]"
    :class="collapsed ? 'w-[3.25rem]' : 'w-60'"
    :aria-label="collapsed ? '工作台导航（已收起）' : '工作台导航'"
  >
    <div
      class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-x-none py-3"
      :class="collapsed ? 'px-1.5' : 'px-3'"
    >
      <div :class="collapsed ? 'space-y-3' : 'space-y-6'">
        <div v-for="(group, groupIndex) in workbenchNavGroups" :key="group.title">
          <p
            v-if="!collapsed"
            class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            {{ group.title }}
          </p>
          <div
            v-else-if="groupIndex > 0"
            class="mx-auto mb-2 h-px w-6 bg-slate-200/90"
            aria-hidden="true"
          />
          <nav class="space-y-0.5" :aria-label="group.title">
            <NuxtLink
              v-for="item in group.items"
              :key="item.label"
              :to="item.to"
              class="flex items-center rounded-lg text-sm transition-colors"
              :class="[
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-2 py-2',
                isActiveItem(item)
                  ? 'bg-blue-500/10 text-blue-800 font-medium'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              ]"
              :aria-label="collapsed ? item.label : undefined"
              @mouseenter="showHoverTip($event.currentTarget, item.label)"
              @mouseleave="hideHoverTip"
              @focus="showHoverTip($event.currentTarget, item.label)"
              @blur="hideHoverTip"
              @click="openPath(item.to)"
            >
              <van-icon :name="item.icon" size="18" class="shrink-0 opacity-80" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-slate-200/80 bg-white/90 p-2" :class="collapsed ? 'flex justify-center' : ''">
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        :class="collapsed ? 'w-8 justify-center' : 'w-full gap-2 px-2 text-sm'"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? '展开侧栏目录' : '收起侧栏目录'"
        @mouseenter="showHoverTip($event.currentTarget, '展开目录')"
        @mouseleave="hideHoverTip"
        @focus="showHoverTip($event.currentTarget, '展开目录')"
        @blur="hideHoverTip"
        @click="toggle"
      >
        <WorkbenchSidebarToggleIcon :collapsed="collapsed" />
        <span v-if="!collapsed">收起目录</span>
      </button>
    </div>
  </aside>

  <Teleport to="body">
    <div
      v-if="collapsed && hoverTip"
      role="tooltip"
      class="pointer-events-none fixed z-[200] -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[0_6px_20px_rgba(15,23,42,0.12)]"
      :style="{ top: `${hoverTip.top}px`, left: `${hoverTip.left}px` }"
    >
      {{ hoverTip.text }}
    </div>
  </Teleport>
</template>

<style scoped>
.workbench-sidebar nav a:focus-visible {
  outline: 2px solid rgb(59 130 246 / 0.55);
  outline-offset: 2px;
}
</style>
