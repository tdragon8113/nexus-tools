<template>
  <div class="doc-page-gradient min-h-screen text-slate-900">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <nav class="text-sm text-slate-500 mb-8" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="mx-2 text-slate-300">/</span>
        <span class="text-slate-900 font-medium">管理台</span>
      </nav>

      <header class="mb-10 md:mb-12 max-w-2xl">
        <p class="doc-eyebrow mb-3">独立模块</p>
        <h1 class="font-display text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          管理台
        </h1>
        <p class="mt-4 doc-prose-muted text-base">
          与首页「小工具」并列的一套工作台：适合功能多、流程长、需要单独信息架构的能力。当前已接入时间管理，后续可在此扩展更多管理类模块。
        </p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <NuxtLink
          to="/manage/time"
          class="group doc-surface rounded-2xl p-6 flex flex-col gap-3 transition-all hover:shadow-md hover:border-indigo-200/90 hover:-translate-y-0.5"
        >
          <div
            class="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-50"
          >
            <van-icon name="notes-o" size="26" class="text-indigo-600" />
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold text-slate-900">时间管理</h2>
            <p class="text-sm text-slate-500 mt-1 leading-relaxed">
              时钟、时间戳换算、番茄专注；后续可在此迭代日程、项目与习惯等能力。
            </p>
          </div>
          <span class="text-sm font-medium text-indigo-600 group-hover:underline inline-flex items-center gap-1">
            进入工作台
            <van-icon name="arrow" size="14" />
          </span>
        </NuxtLink>

        <div
          class="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 flex flex-col justify-center text-center text-slate-500 text-sm"
        >
          <p class="font-medium text-slate-600">更多模块</p>
          <p class="mt-2 leading-relaxed">规划中。需要与轻量工具拆分时，优先挂到管理台。</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: '管理台 - Nexus Tools'
})
</script>
