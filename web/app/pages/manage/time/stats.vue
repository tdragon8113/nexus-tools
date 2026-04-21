<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <nav class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage" class="hover:text-blue-600 transition-colors">管理台</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <NuxtLink to="/manage/time" class="hover:text-blue-600 transition-colors">时间管理</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-900 font-medium">时间统计</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <van-icon name="bar-chart-o" size="20" class="text-indigo-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">时间统计</h1>
        </div>
      </header>

      <!-- 未登录提示 -->
      <section v-if="!isLoggedIn" class="doc-surface rounded-2xl p-6 text-center">
        <p class="text-slate-600 mb-4">登录后可查看专注统计数据</p>
        <van-button type="primary" @click="navigateTo('/auth/login')">
          前往登录
        </van-button>
      </section>

      <!-- 统计数据 -->
      <section v-else class="space-y-6">
        <!-- 汇总卡片 -->
        <div class="grid sm:grid-cols-3 gap-4">
          <div class="doc-surface rounded-xl p-5 text-center">
            <p class="text-sm text-slate-500 mb-2">今日专注</p>
            <p class="font-mono text-2xl font-medium text-blue-600">{{ stats?.todayMinutes ?? 0 }} 分钟</p>
          </div>
          <div class="doc-surface rounded-xl p-5 text-center">
            <p class="text-sm text-slate-500 mb-2">本周专注</p>
            <p class="font-mono text-2xl font-medium text-emerald-600">{{ stats?.weekMinutes ?? 0 }} 分钟</p>
          </div>
          <div class="doc-surface rounded-xl p-5 text-center">
            <p class="text-sm text-slate-500 mb-2">本月专注</p>
            <p class="font-mono text-2xl font-medium text-purple-600">{{ stats?.monthMinutes ?? 0 }} 分钟</p>
          </div>
        </div>

        <!-- 每小时分布 -->
        <section class="doc-surface rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
            <h2 class="font-medium text-slate-900">每小时分布（本周）</h2>
          </div>
          <div class="p-5">
            <div class="flex gap-1 h-24">
              <div
                v-for="hour in hourlyData"
                :key="hour.label"
                class="flex-1 flex flex-col items-center"
              >
                <div
                  class="w-full bg-blue-200 rounded-t transition-all"
                  :style="{ height: `${hour.percent}%` }"
                ></div>
                <span class="text-xs text-slate-400 mt-1">{{ hour.label }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 总计 -->
        <section class="doc-surface rounded-xl p-5 text-center">
          <p class="text-sm text-slate-500 mb-2">累计专注次数</p>
          <p class="font-mono text-3xl font-medium text-slate-900">{{ stats?.totalSessions ?? 0 }} 次</p>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useActivityApi, type Stats } from '~/composables/useActivityApi'

definePageMeta({
  layout: false
})

useHead({
  title: '时间统计 · 时间管理 - Nexus Tools'
})

const userId = useCookie('userId')
const isLoggedIn = computed(() => !!userId.value)

const activityApi = useActivityApi()
const stats = ref<Stats | null>(null)

interface HourlyBar {
  label: string
  minutes: number
  percent: number
}

const hourlyData = computed(() => {
  if (!stats.value?.hourlyDistribution) {
    return Array.from({ length: 24 }, (_, i) => ({
      label: String(i).padStart(2, '0'),
      minutes: 0,
      percent: 0
    }))
  }

  const distribution = stats.value.hourlyDistribution
  const maxMinutes = Math.max(...Object.values(distribution), 1)

  return Array.from({ length: 24 }, (_, i) => {
    const label = String(i).padStart(2, '0')
    const minutes = distribution[label] ?? 0
    return {
      label,
      minutes,
      percent: Math.round((minutes / maxMinutes) * 100)
    }
  })
})

async function loadStats() {
  if (!isLoggedIn.value) return
  stats.value = await activityApi.getStats()
}

onMounted(() => {
  loadStats()
})
</script>