<script setup lang="ts">
const props = defineProps<{
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
  clearCommand: []
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
  <div class="nexus-raycast-header nexus-raycast-header--embedded mb-2 shrink-0" style="-webkit-app-region: no-drag">
    <div
      class="nexus-raycast-header-input flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5 py-2"
    >
      <van-icon name="search" class="nexus-raycast-icon-muted pointer-events-none shrink-0" size="18" />

      <div
        class="relative min-w-0 flex-1"
        :class="props.showQuery ? 'max-w-[calc(100%-11.5rem)]' : ''"
      >
        <input
          ref="commandRef"
          :value="command"
          type="text"
          role="searchbox"
          autocomplete="off"
          spellcheck="false"
          class="nexus-raycast-type-body w-full border-0 bg-transparent pr-6 outline-none focus:ring-0"
          :class="queryFocused ? 'opacity-60' : ''"
          placeholder="按名称搜索工具或应用…"
          autofocus
          @focus="emit('focusCommand')"
          @input="emit('update:command', ($event.target as HTMLInputElement).value)"
          @keydown="onCommandKeydown"
          @keydown.enter.prevent="emit('keydown', $event)"
        />
        <button
          v-if="command.trim()"
          type="button"
          class="nexus-raycast-icon-muted nexus-raycast-btn-ghost absolute right-0 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors"
          aria-label="清空搜索"
          @mousedown.prevent
          @click="emit('clearCommand')"
        >
          <van-icon name="cross" size="14" />
        </button>
      </div>

      <div
        v-if="showQuery"
        class="nexus-raycast-query-pill ml-1 flex w-[11.5rem] max-w-[38%] shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors"
        :class="queryFocused ? 'is-focused' : ''"
      >
        <span class="nexus-raycast-text-muted nexus-raycast-type-caption shrink-0 font-semibold uppercase tracking-wide">Query</span>
        <input
          ref="queryRef"
          :value="query"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="nexus-raycast-type-secondary min-w-0 flex-1 border-0 bg-transparent font-mono outline-none focus:ring-0"
          placeholder="粘贴内容以匹配工具…"
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
