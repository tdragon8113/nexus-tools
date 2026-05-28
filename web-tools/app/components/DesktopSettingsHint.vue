<script setup lang="ts">
defineProps<{
  text: string
}>()

const open = ref(false)

function show() {
  open.value = true
}

function hide() {
  open.value = false
}
</script>

<template>
  <span
    class="relative inline-flex shrink-0 align-middle"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <button
      type="button"
      class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-slate-300/90 bg-slate-100/90 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors hover:border-blue-300/80 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500/40"
      :aria-label="text"
      :aria-describedby="open ? 'settings-hint-popover' : undefined"
      @focus="show"
      @blur="hide"
    >
      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5" />
        <path
          d="M8 7.1V11"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
      </svg>
    </button>
    <Transition name="settings-hint">
      <span
        v-if="open"
        id="settings-hint-popover"
        role="tooltip"
        class="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 z-50 w-max max-w-[280px] -translate-y-1/2 rounded-md bg-[rgba(30,30,30,0.92)] px-2.5 py-1.5 text-left text-[11px] leading-[1.45] text-white shadow-lg"
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.settings-hint-enter-active,
.settings-hint-leave-active {
  transition: opacity 0.12s ease;
}

.settings-hint-enter-from,
.settings-hint-leave-to {
  opacity: 0;
}
</style>
