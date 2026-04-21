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
        <span class="text-slate-900 font-medium">习惯追踪</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <van-icon name="star-o" size="20" class="text-purple-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">习惯追踪</h1>
        </div>
      </header>

      <!-- 未登录提示 -->
      <section v-if="!isLoggedIn" class="doc-surface rounded-2xl p-6 text-center">
        <p class="text-slate-600 mb-4">登录后可同步习惯数据到云端</p>
        <van-button type="primary" @click="navigateTo('/auth/login')">
          前往登录
        </van-button>
      </section>

      <!-- 习惯列表 -->
      <section v-else class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="font-medium text-slate-700">我的习惯</h2>
          <van-button size="small" type="primary" @click="showCreateModal = true">
            新增习惯
          </van-button>
        </div>

        <div v-if="habits.length === 0" class="doc-surface rounded-xl p-6 text-center text-slate-500">
          还没有习惯，点击「新增习惯」开始追踪吧
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="habit in habits"
            :key="habit.id"
            class="doc-surface rounded-xl p-4 flex items-center gap-4"
          >
            <button
              type="button"
              class="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all"
              :class="isTodayChecked(habit) ? 'bg-purple-100 border border-purple-200' : 'bg-slate-50 border border-slate-200 hover:border-purple-300'"
              @click="handleCheckin(habit)"
            >
              <van-icon
                :name="isTodayChecked(habit) ? 'success' : habit.icon"
                size="24"
                :class="isTodayChecked(habit) ? 'text-purple-600' : 'text-slate-400'"
              />
            </button>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900">{{ habit.name }}</p>
              <p class="text-sm text-slate-500 mt-1">
                连续 {{ habit.streakDays }} 天 · 目标：{{ targetText(habit.target) }}
              </p>
            </div>
            <button type="button" class="text-slate-400 hover:text-red-500" @click="handleDelete(habit)">
              <van-icon name="delete-o" size="18" />
            </button>
          </div>
        </div>
      </section>

      <!-- 创建习惯弹窗 -->
      <van-popup v-model:show="showCreateModal" position="bottom" round>
        <div class="p-6">
          <h3 class="font-medium text-slate-900 mb-4">创建新习惯</h3>
          <van-field v-model="newHabit.name" label="习惯名称" placeholder="例如：每天读书" />
          <van-field v-model="newHabit.icon" label="图标（Vant）" placeholder="例如：star-o" />
          <van-field v-model="newHabit.target" label="目标频率" placeholder="daily / weekly" />
          <div class="mt-4 flex gap-2">
            <van-button block @click="showCreateModal = false">取消</van-button>
            <van-button block type="primary" @click="handleCreate">创建</van-button>
          </div>
        </div>
      </van-popup>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useHabitsApi, type Habit } from '~/composables/useHabitsApi'

definePageMeta({
  layout: false
})

useHead({
  title: '习惯追踪 · 时间管理 - Nexus Tools'
})

const userId = useCookie('userId')
const isLoggedIn = computed(() => !!userId.value)

const habitsApi = useHabitsApi()
const habits = ref<Habit[]>([])
const showCreateModal = ref(false)
const newHabit = ref({ name: '', icon: 'star-o', target: 'daily' })

function targetText(target: string) {
  if (target === 'daily') return '每天'
  if (target === 'weekly') return '每周'
  return '自定义'
}

function isTodayChecked(habit: Habit) {
  const today = new Date().toISOString().slice(0, 10)
  return habit.recentCheckins.includes(today)
}

async function loadHabits() {
  if (!isLoggedIn.value) return
  habits.value = await habitsApi.list()
}

async function handleCheckin(habit: Habit) {
  if (isTodayChecked(habit)) {
    showToast('今日已打卡')
    return
  }
  const result = await habitsApi.checkin(habit.id)
  if (result) {
    showToast('打卡成功')
    await loadHabits()
  }
}

async function handleCreate() {
  if (!newHabit.value.name.trim()) {
    showToast('请输入习惯名称')
    return
  }
  const result = await habitsApi.create(newHabit.value)
  if (result) {
    showToast('创建成功')
    showCreateModal.value = false
    newHabit.value = { name: '', icon: 'star-o', target: 'daily' }
    await loadHabits()
  }
}

async function handleDelete(habit: Habit) {
  try {
    await showConfirmDialog({ title: '确认删除', message: `确定要删除「${habit.name}」吗？` })
    const success = await habitsApi.deleteHabit(habit.id)
    if (success) {
      showToast('已删除')
      await loadHabits()
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadHabits()
})
</script>