<template>
  <section class="doc-surface overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/60">
      <h2 class="font-sans text-sm font-semibold text-slate-900">{{ listTitle }}</h2>
      <span class="text-xs text-slate-500">{{ activities.length }} 条</span>
    </div>

    <div v-if="loading" class="py-10 flex justify-center">
      <van-loading size="24px" />
    </div>

    <div v-else-if="activities.length === 0" class="py-10 px-4 text-center">
      <van-icon :name="emptyIcon" size="36" class="text-slate-300 mx-auto mb-3" />
      <p class="text-sm text-slate-500">{{ emptyTitle }}</p>
      <p class="text-xs text-slate-400 mt-1">{{ emptyHint }}</p>
    </div>

    <van-cell-group v-else :border="false">
      <van-swipe-cell v-for="item in activities" :key="item.id">
        <van-cell>
          <template #title>
            <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span class="truncate">{{ item.title }}</span>
              <span
                v-for="tag in parsedNotes(item).tags ?? []"
                :key="tag"
                class="shrink-0 inline-flex rounded-full bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {{ tag }}
              </span>
            </div>
          </template>
          <template v-if="hasLabel(item)" #label>
            <div class="space-y-1 pt-0.5">
              <RichTextContent
                v-if="parsedNotes(item).summary"
                :source="parsedNotes(item).summary!"
                compact
              />
              <p v-if="feelingLabel(item)" class="text-xs text-slate-500">
                {{ feelingLabel(item) }}
              </p>
            </div>
          </template>
          <template #icon>
            <div
              class="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="categoryStyle(item.category).bg"
            >
              <van-icon
                :name="categoryStyle(item.category).icon"
                size="18"
                :class="categoryStyle(item.category).text"
              />
            </div>
          </template>
          <template #value>
            <div class="text-right">
              <span class="text-xs text-indigo-600 tabular-nums font-medium">
                {{ formatMinutes(item.durationMinutes) }}
              </span>
              <p class="text-[11px] text-slate-400 tabular-nums mt-0.5">
                <template v-if="!item.endTime">
                  {{ formatTimeOfDay(item.startTime) }} 起 · 进行中
                </template>
                <template v-else>
                  {{ formatTimeOfDay(item.startTime) }}–{{ formatTimeOfDay(item.endTime) }}
                </template>
              </p>
            </div>
          </template>
        </van-cell>
        <template #right>
          <van-button
            square
            type="danger"
            text="删除"
            class="!h-full"
            @click="$emit('delete', item.id)"
          />
        </template>
      </van-swipe-cell>
    </van-cell-group>
  </section>
</template>

<script setup lang="ts">
import {
  type Activity,
  type ActivityCategory
} from '~/composables/useWorkspaceApi'
import { formatFeelingDisplay, parseRecordNotes } from '~/composables/useLifeCards'
import { formatMinutes, formatTimeOfDay } from '~/utils/time'

withDefaults(defineProps<{
  activities: Activity[]
  loading?: boolean
  listTitle?: string
  emptyTitle?: string
  emptyHint?: string
  emptyIcon?: string
}>(), {
  listTitle: '今天',
  emptyTitle: '今天还没有记录',
  emptyHint: '点右下角 + 开始第一段',
  emptyIcon: 'notes-o'
})

defineEmits<{
  delete: [id: number]
}>()

function parsedNotes (item: Activity) {
  return parseRecordNotes(item.notes)
}

function feelingLabel (item: Activity) {
  return formatFeelingDisplay(parsedNotes(item))
}

function hasLabel (item: Activity) {
  const parsed = parsedNotes(item)
  return Boolean(parsed.summary || feelingLabel(item))
}

function categoryStyle (category: ActivityCategory) {
  switch (category) {
    case 'pomodoro-work':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'fire-o' }
    case 'pomodoro-break':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'smile-o' }
    case 'meeting':
      return { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'briefcase-o' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'flower-o' }
  }
}
</script>
