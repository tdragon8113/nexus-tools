<script setup lang="ts">
const {
  tabs,
  activePath,
  restore,
  activatePath,
  closePath,
  syncRouteTab
} = useWorkbenchTabs()

const route = useRoute()

onMounted(() => {
  restore()
  syncRouteTab()
})

watch(
  () => route.path,
  () => syncRouteTab()
)
</script>

<template>
  <div class="h-11 shrink-0 border-b border-slate-200 bg-slate-50/60">
    <div class="flex h-full min-w-0 items-end gap-1 px-2 pt-1.5">
      <template v-if="tabs.length > 0">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          type="button"
          class="group relative flex h-8 max-w-56 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-2.5 text-sm transition-colors"
          :class="
            activePath === tab.path
              ? 'z-10 -mb-px border-slate-300 border-b-white bg-white text-blue-800 shadow-sm'
              : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900'
          "
          @click="activatePath(tab.path)"
        >
          <van-icon :name="tab.icon" size="16" class="shrink-0 opacity-80" />
          <span class="truncate">{{ tab.label }}</span>
          <span
            type="button"
            class="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            role="button"
            tabindex="0"
            aria-label="关闭标签"
            @click.stop="closePath(tab.path)"
            @keydown.enter.stop.prevent="closePath(tab.path)"
          >
            <van-icon name="cross" size="12" />
          </span>
        </button>
      </template>
      <p v-else class="px-2 pb-2 text-xs text-slate-500">
        从左侧选择工具开始
      </p>
    </div>
  </div>
</template>
