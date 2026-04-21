<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <nav class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage" class="hover:text-blue-600 transition-colors">管理台</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-900 font-medium">时间管理</span>
      </nav>

      <header class="mb-8 pb-8 border-b border-slate-200/80">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            class="w-12 h-12 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-100"
          >
            <van-icon name="notes-o" size="24" class="text-indigo-600" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600/90 mb-2">管理台 · 时间管理</p>
            <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              时间管理
            </h1>
            <p class="mt-2 doc-prose-muted text-base max-w-2xl">
              一套完整的时间管理工具：时钟、时间戳、番茄专注、习惯追踪、日程管理与统计数据。
            </p>
          </div>
        </div>
      </header>

      <!-- 模块导航 -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          to="/manage/time/clock"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100">
            <van-icon name="clock-o" size="22" class="text-blue-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">此刻时钟</h2>
            <p class="text-sm text-slate-500 mt-1">实时显示当前时间、日期与时区。</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/manage/time/timestamp"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100">
            <van-icon name="exchange" size="22" class="text-emerald-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">时间戳互转</h2>
            <p class="text-sm text-slate-500 mt-1">Unix 时间戳与本地日期时间换算。</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/manage/time/pomodoro"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100">
            <van-icon name="fire-o" size="22" class="text-orange-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">番茄专注</h2>
            <p class="text-sm text-slate-500 mt-1">25 分钟专注 + 5 分钟短休息计时。</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/manage/time/habits"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:bg-purple-100">
            <van-icon name="star-o" size="22" class="text-purple-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">习惯追踪</h2>
            <p class="text-sm text-slate-500 mt-1">追踪每日习惯，打卡记录与连续天数统计。</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/manage/time/schedule"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center group-hover:bg-cyan-100">
            <van-icon name="calendar-o" size="22" class="text-cyan-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">日程管理</h2>
            <p class="text-sm text-slate-500 mt-1">添加日程安排，日历视图查看与管理。</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/manage/time/stats"
          class="group doc-surface rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-blue-200/80 hover:-translate-y-0.5"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100">
            <van-icon name="bar-chart-o" size="22" class="text-indigo-600" />
          </div>
          <div>
            <h2 class="font-display text-base font-semibold text-slate-900">时间统计</h2>
            <p class="text-sm text-slate-500 mt-1">番茄专注时长汇总与时段分布图表。</p>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: '时间管理 · 管理台 - Nexus Tools'
})
</script>