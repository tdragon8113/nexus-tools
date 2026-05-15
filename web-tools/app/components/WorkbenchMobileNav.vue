<script setup lang="ts">
const config = useRuntimeConfig()
const timeAppUrl = computed(() => String(config.public.timeAppUrl || '/'))
</script>

<template>
  <div
    class="lg:hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-2 py-2"
  >
    <nav
      class="flex gap-1 overflow-x-auto text-sm whitespace-nowrap pb-0.5"
      aria-label="快捷导航"
    >
      <NuxtLink
        to="/"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        首页
      </NuxtLink>
      <NuxtLink
        to="/tools/json"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        JSON
      </NuxtLink>
      <a
        :href="timeAppUrl"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        时间管理
      </a>
    </nav>
  </div>
</template>
