<script setup lang="ts">
import WebGlobalSearch from '~/components/WebGlobalSearch.vue'
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md"
  >
    <div class="flex h-14 w-full items-center gap-4 px-4">
      <NuxtLink to="/tools" class="group flex w-56 shrink-0 items-center gap-3 min-w-0">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm shadow-blue-500/20 transition-opacity group-hover:opacity-95"
        >
          <span class="font-display text-base font-semibold leading-none text-white">N</span>
        </div>
        <span
          class="font-display block truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-base font-bold tracking-tight text-transparent"
        >
          Nexus Tools
        </span>
      </NuxtLink>

      <WebGlobalSearch class="max-w-3xl min-w-0 flex-1" />

      <div class="flex w-28 shrink-0 justify-end">
        <NuxtLink
          to="/tools"
          class="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          工具集
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
