<template>
  <div
    class="lg:hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-2 py-2"
  >
    <nav
      class="flex gap-1 overflow-x-auto text-sm whitespace-nowrap pb-0.5"
      aria-label="快捷导航"
    >
      <NuxtLink
        to="/manage/time"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        概览
      </NuxtLink>
      <NuxtLink
        to="/manage/time/clock"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        时钟
      </NuxtLink>
      <NuxtLink
        to="/manage/time/pomodoro"
        class="shrink-0 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        active-class="!bg-blue-500/15 !text-blue-800 font-medium"
      >
        番茄
      </NuxtLink>
    </nav>
  </div>
</template>
