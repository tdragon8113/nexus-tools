<script setup lang="ts">
const pageTitle = usePageTitle()
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]"
  >
    <div
      class="mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 min-h-11"
    >
      <NuxtLink
        to="/manage/time"
        class="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/50"
        aria-label="返回浏览"
      >
        <AppBrandMark variant="header" />
      </NuxtLink>

      <h1 class="min-w-0 font-sans text-base font-semibold text-slate-900 text-center truncate leading-normal">
        {{ pageTitle }}
      </h1>

      <div class="w-9 shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  </header>
</template>
