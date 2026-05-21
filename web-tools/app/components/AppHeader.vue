<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md"
  >
    <div class="flex h-14 w-full items-center gap-4 px-4">
      <NuxtLink to="/" class="flex w-56 shrink-0 items-center gap-3 min-w-0 group">
        <div
          class="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:opacity-95 transition-opacity"
        >
          <span class="font-display font-semibold text-base text-white leading-none">N</span>
        </div>
        <span
          class="block font-display text-base font-bold tracking-tight truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Nexus Tools
        </span>
      </NuxtLink>

      <ToolSearchBar class="max-w-3xl min-w-0 flex-1" />

      <div class="flex w-28 shrink-0 justify-end">
        <NuxtLink
          to="/"
          class="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          工作台
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
