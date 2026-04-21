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
        <span class="text-slate-900 font-medium">日程管理</span>
      </nav>

      <header class="mb-8 pb-6 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
            <van-icon name="calendar-o" size="20" class="text-cyan-600" />
          </div>
          <h1 class="font-display text-xl font-semibold text-slate-900">日程管理</h1>
        </div>
      </header>

      <!-- 未登录提示 -->
      <section v-if="!isLoggedIn" class="doc-surface rounded-2xl p-6 text-center">
        <p class="text-slate-600 mb-4">登录后可同步日程数据到云端</p>
        <van-button type="primary" @click="navigateTo('/auth/login')">
          前往登录
        </van-button>
      </section>

      <!-- 日程管理 -->
      <section v-else class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <button type="button" class="text-slate-600 hover:text-blue-600" @click="prevMonth">
              <van-icon name="arrow-left" />
            </button>
            <span class="font-medium text-slate-900">{{ monthLabel }}</span>
            <button type="button" class="text-slate-600 hover:text-blue-600" @click="nextMonth">
              <van-icon name="arrow" />
            </button>
          </div>
          <van-button size="small" type="primary" @click="showCreateModal = true">
            新增日程
          </van-button>
        </div>

        <!-- 日历网格 -->
        <div class="doc-surface rounded-xl p-4">
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            <span v-for="d in ['日', '一', '二', '三', '四', '五', '六']" :key="d" class="text-xs text-slate-500">{{ d }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="day in calendarDays"
              :key="day.date"
              type="button"
              class="aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors"
              :class="day.isToday ? 'bg-blue-100 text-blue-700' : day.hasEvent ? 'bg-cyan-50 text-slate-700' : 'text-slate-600 hover:bg-slate-50'"
              @click="selectDate(day.date)"
            >
              <span>{{ day.dayNum }}</span>
              <span v-if="day.hasEvent" class="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1"></span>
            </button>
          </div>
        </div>

        <!-- 当日日程列表 -->
        <div v-if="selectedDateEvents.length > 0" class="space-y-2">
          <h3 class="font-medium text-slate-700">{{ selectedDateLabel }} 的日程</h3>
          <div
            v-for="event in selectedDateEvents"
            :key="event.id"
            class="doc-surface rounded-xl p-4 flex items-center gap-4"
          >
            <div
              class="w-2 h-2 rounded-full shrink-0"
              :class="event.status === 2 ? 'bg-green-500' : 'bg-cyan-500'"
            ></div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900">{{ event.title }}</p>
              <p v-if="event.dueDate" class="text-sm text-slate-500 mt-1">
                {{ formatTime(event.dueDate) }}
              </p>
            </div>
            <button type="button" class="text-slate-400 hover:text-red-500" @click="handleDelete(event)">
              <van-icon name="delete-o" size="18" />
            </button>
          </div>
        </div>
        <div v-else class="doc-surface rounded-xl p-4 text-center text-slate-500">
          {{ selectedDateLabel }} 暂无日程
        </div>
      </section>

      <!-- 创建日程弹窗 -->
      <van-popup v-model:show="showCreateModal" position="bottom" round>
        <div class="p-6">
          <h3 class="font-medium text-slate-900 mb-4">创建新日程</h3>
          <van-field v-model="newTodo.title" label="标题" placeholder="例如：项目会议" />
          <van-field v-model="newTodo.dueDate" label="日期时间" type="datetime-local" />
          <van-field v-model="newTodo.description" label="描述" placeholder="可选" />
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
import { useScheduleApi, type Todo } from '~/composables/useScheduleApi'

definePageMeta({
  layout: false
})

useHead({
  title: '日程管理 · 时间管理 - Nexus Tools'
})

const userId = useCookie('userId')
const isLoggedIn = computed(() => !!userId.value)

const scheduleApi = useScheduleApi()
const todos = ref<Todo[]>([])
const showCreateModal = ref(false)
const newTodo = ref({ title: '', dueDate: '', description: '' })

const currentMonth = ref(new Date())
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const monthLabel = computed(() => {
  const d = currentMonth.value
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
})

function prevMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
}

function nextMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
}

interface CalendarDay {
  date: string
  dayNum: number
  isToday: boolean
  hasEvent: boolean
}

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const todayStr = new Date().toISOString().slice(0, 10)

  const days: CalendarDay[] = []

  // 前置空白
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: '', dayNum: 0, isToday: false, hasEvent: false })
  }

  // 实际日期
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: dateStr,
      dayNum: d,
      isToday: dateStr === todayStr,
      hasEvent: todos.value.some(t => t.dueDate?.slice(0, 10) === dateStr)
    })
  }

  return days
})

const selectedDateLabel = computed(() => {
  const parts = selectedDate.value.split('-')
  return `${parts[1]} 月 ${parts[2]} 日`
})

const selectedDateEvents = computed(() => {
  return todos.value.filter(t => t.dueDate?.slice(0, 10) === selectedDate.value)
})

function selectDate(date: string) {
  if (date) selectedDate.value = date
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadTodos() {
  if (!isLoggedIn.value) return
  todos.value = await scheduleApi.list()
}

async function handleCreate() {
  if (!newTodo.value.title.trim()) {
    showToast('请输入标题')
    return
  }
  const result = await scheduleApi.create({
    title: newTodo.value.title,
    dueDate: newTodo.value.dueDate,
    description: newTodo.value.description
  })
  if (result) {
    showToast('创建成功')
    showCreateModal.value = false
    newTodo.value = { title: '', dueDate: '', description: '' }
    await loadTodos()
  }
}

async function handleDelete(event: Todo) {
  try {
    await showConfirmDialog({ title: '确认删除', message: `确定要删除「${event.title}」吗？` })
    const success = await scheduleApi.deleteTodo(event.id)
    if (success) {
      showToast('已删除')
      await loadTodos()
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadTodos()
})
</script>