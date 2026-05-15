<script setup lang="ts">
const config = useRuntimeConfig()
const timeAppUrl = computed(() => String(config.public.timeAppUrl || '/'))
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md"
  >
    <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
      <div class="flex justify-between items-center gap-3 min-w-0">
        <NuxtLink to="/" class="flex items-center gap-3 min-w-0 group">
          <div
            class="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:opacity-95 transition-opacity"
          >
            <span class="font-display font-semibold text-lg text-white leading-none">N</span>
          </div>
          <div class="min-w-0 text-left">
            <span
              class="block font-display text-lg font-bold tracking-tight truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Nexus Tools
            </span>
            <span class="hidden sm:block text-[11px] text-slate-500 leading-tight truncate">
              开发者小工具 · 无需后端
            </span>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <a
            :href="timeAppUrl"
            class="px-2 sm:px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 rounded-md hover:bg-indigo-50/60 transition-colors"
          >
            时间管理
          </a>
        </div>
      </div>

      <ToolSearchBar class="w-full min-w-0" />
    </div>
  </header>
</template>
