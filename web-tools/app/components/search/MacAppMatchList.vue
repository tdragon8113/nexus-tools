<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import type { MacAppEntry } from '~~/shared/macApps'

const props = defineProps<{
  apps: MacAppEntry[]
  activeIndex: number
  toolCount: number
}>()

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  pick: [app: MacAppEntry]
}>()

function setActive(i: number) {
  emit('update:activeIndex', props.toolCount + i)
}
</script>

<template>
  <div v-if="apps.length" class="mt-2.5" role="listbox" aria-label="Mac 应用程序">
    <p class="mb-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
      应用程序
    </p>
    <div class="flex flex-col gap-1">
      <button
        v-for="(app, i) in apps"
        :key="app.id"
        type="button"
        role="option"
        :aria-selected="toolCount + i === activeIndex"
        class="flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors"
        :class="
          toolCount + i === activeIndex
            ? 'border-indigo-300 bg-indigo-50 shadow-sm shadow-indigo-500/10'
            : 'border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
        "
        @mouseenter="setActive(i)"
        @mousedown.prevent="emit('pick', app)"
      >
        <MacAppIcon :app-path="app.path" />
        <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{{ app.name }}</span>
      </button>
    </div>
  </div>
</template>
