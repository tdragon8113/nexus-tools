<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  modelValue: T
  options: { value: T; label: string; hint?: string }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const currentLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? ''
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value: T) {
  if (props.disabled || value === props.modelValue) {
    open.value = false
    return
  }
  emit('update:modelValue', value)
  open.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  const root = rootRef.value
  if (!root || root.contains(event.target as Node)) return
  open.value = false
}

watch(open, (visible) => {
  if (!import.meta.client) return
  if (visible) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
})
</script>

<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      type="button"
      class="nexus-settings-trigger disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="flex min-w-0 flex-1 items-center truncate pl-2">{{ currentLabel }}</span>
      <span class="nexus-settings-trigger-chevron flex w-5 shrink-0 items-center justify-center" aria-hidden="true">
        <svg
          class="h-3 w-3 transition-transform duration-150"
          :class="open && 'rotate-180'"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.25 6 7.25 9 4.25"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <Transition name="settings-popup">
      <ul
        v-if="open"
        role="listbox"
        class="nexus-settings-menu absolute right-0 top-[calc(100%+4px)] z-50 w-[4.75rem] overflow-hidden rounded-lg py-1"
      >
        <li v-for="opt in options" :key="opt.value" role="presentation">
          <button
            type="button"
            role="option"
            class="nexus-settings-menu-option flex w-full items-center justify-center px-2 py-1.5 text-center text-[13px] transition-colors hover:bg-indigo-600 hover:text-white"
            :aria-selected="modelValue === opt.value"
            :title="opt.hint"
            @click="select(opt.value)"
          >
            <span class="truncate">{{ opt.label }}</span>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.settings-popup-enter-active,
.settings-popup-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.settings-popup-enter-from,
.settings-popup-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
