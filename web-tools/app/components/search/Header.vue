<script setup lang="ts">
defineProps<{
  command: string
  query: string
  queryFocused: boolean
  showQuery: boolean
  hasQuery: boolean
  hasPayload: boolean
}>()

const emit = defineEmits<{
  'update:command': [value: string]
  'update:query': [value: string]
  clearQuery: []
  focusQuery: []
  focusCommand: []
  paste: [event: ClipboardEvent]
  keydown: [event: KeyboardEvent]
}>()

const commandRef = ref<HTMLInputElement | null>(null)
const queryRef = ref<HTMLInputElement | null>(null)

defineExpose({
  focusCommand() {
    commandRef.value?.focus()
  },
  focusQuery() {
    queryRef.value?.focus()
  }
})

function onCommandKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' && !event.shiftKey && queryRef.value) {
    event.preventDefault()
    queryRef.value.focus()
    emit('focusQuery')
    return
  }
  emit('keydown', event)
}

function onQueryKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' && event.shiftKey) {
    event.preventDefault()
    commandRef.value?.focus()
    emit('focusCommand')
    return
  }
  emit('keydown', event)
}
</script>

<template>
  <div class="nexus-raycast-header" style="-webkit-app-region: no-drag">
    <div class="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3">
      <van-icon name="search" class="nexus-raycast-icon-muted pointer-events-none shrink-0" size="18" />

      <input
        ref="commandRef"
        :value="command"
        type="text"
        role="searchbox"
        autocomplete="off"
        spellcheck="false"
        class="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none focus:ring-0"
        :class="queryFocused ? 'opacity-60' : ''"
        placeholder="搜索工具或 Mac 应用…"
        autofocus
        @focus="emit('focusCommand')"
        @input="emit('update:command', ($event.target as HTMLInputElement).value)"
        @keydown="onCommandKeydown"
        @keydown.enter.prevent="emit('keydown', $event)"
      />

      <div
        v-if="showQuery"
        class="nexus-raycast-query-pill flex max-w-[min(44%,15rem)] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors"
        :class="queryFocused ? 'is-focused' : ''"
      >
        <span class="nexus-raycast-text-muted shrink-0 text-[10px] font-semibold uppercase tracking-wide">Query</span>
        <input
          ref="queryRef"
          :value="query"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs outline-none focus:ring-0"
          placeholder="输入内容…"
          @focus="emit('focusQuery')"
          @input="emit('update:query', ($event.target as HTMLInputElement).value)"
          @paste="emit('paste', $event)"
          @keydown="onQueryKeydown"
          @keydown.enter.prevent="emit('keydown', $event)"
        />
        <button
          v-if="hasQuery || hasPayload"
          type="button"
          class="nexus-raycast-icon-muted nexus-raycast-btn-ghost shrink-0 rounded p-0.5 transition-colors"
          aria-label="清空 Query"
          @mousedown.prevent
          @click="emit('clearQuery')"
        >
          <van-icon name="cross" size="12" />
        </button>
      </div>
    </div>
  </div>
</template>
