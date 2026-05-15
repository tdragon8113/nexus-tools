<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <PageBreadcrumb
      :items="[
        { label: '时间管理' }
      ]"
    />

    <PageHero
      eyebrow="时间管理"
      title="时间管理"
      description="一套完整的时间管理工具：时钟、时间戳、番茄专注、习惯追踪、日程管理与统计数据。"
    >
      <template #icon>
        <div
          class="w-12 h-12 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-100"
        >
          <van-icon name="notes-o" size="24" class="text-indigo-600" />
        </div>
      </template>
    </PageHero>

    <!-- 模块导航 -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        to="/manage/time/clock"
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
        class="group doc-card-interactive rounded-2xl p-5 flex flex-col gap-3"
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
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '时间管理 - Nexus Tools'
})
</script>
