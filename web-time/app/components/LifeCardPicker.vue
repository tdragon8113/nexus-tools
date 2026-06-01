<template>
  <div class="flex items-start gap-3">
    <span class="shrink-0 whitespace-nowrap pt-2.5 text-sm text-slate-600">{{ modeLabel }}</span>
    <div ref="rootRef" class="relative min-w-0 flex-1">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="life-pick-input w-full"
        :placeholder="placeholder"
        :disabled="saving"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @focus="onFocus"
        @input="onInput"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="confirmHighlighted"
        @keydown.esc.prevent="closeDropdown"
        @blur="onBlur"
      >
    </div>

    <Teleport to="body">
      <ul
        v-if="dropdownOpen && panelReady && suggestions.length > 0"
        class="life-pick-dropdown"
        :style="panelStyle"
        role="listbox"
      >
        <li
          v-for="(item, index) in suggestions"
          :key="`${item.parentId}-${item.childId ?? 'solo'}`"
          role="option"
          class="life-pick-option"
          :class="index === highlightIndex ? 'life-pick-option--active' : ''"
          @mousedown.prevent="selectItem(item)"
        >
          {{ item.text }}
        </li>
      </ul>

      <p
        v-else-if="dropdownOpen && panelReady && query.trim() && suggestions.length === 0"
        class="life-pick-hint"
        :style="panelStyle"
      >
        回车创建「{{ query.trim() }}」
      </p>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  getDefaultLifePick,
  writeLastLifePick,
  type LifeCardPick,
  type LifePickSearchItem
} from '~/composables/useLifeCards'

const props = withDefaults(defineProps<{
  saving?: boolean
  mode?: 'start' | 'switch'
}>(), {
  mode: 'start'
})

const modelValue = defineModel<LifeCardPick>({ required: true })

const {
  cards,
  load,
  pickToInput,
  ensurePickFromInput,
  searchLifePickItems
} = useLifeCards()

const query = ref('')
const dropdownOpen = ref(false)
const panelReady = ref(false)
const highlightIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const applying = ref(false)
const panelStyle = ref<Record<string, string>>({})

const modeLabel = computed(() => (props.mode === 'switch' ? '下一段' : '开始'))
const placeholder = computed(() => '日常/做饭')

const suggestions = computed(() =>
  searchLifePickItems(cards.value, query.value, 8)
)

onMounted(() => {
  load()
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})

watch(
  cards,
  (list) => {
    if (list.length === 0 || modelValue.value.parentId) return
    const defaults = getDefaultLifePick(list)
    if (defaults) applyPick(defaults, false)
  },
  { immediate: true }
)

watch(
  () => modelValue.value,
  (pick) => {
    if (applying.value) return
    query.value = pick.parentId ? pickToInput(pick) : ''
  },
  { deep: true, immediate: true }
)

watch(query, () => {
  highlightIndex.value = 0
  if (dropdownOpen.value) updatePanelPosition()
})

function updatePanelPosition () {
  const el = inputRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`
  }
  panelReady.value = true
}

function onFocus () {
  dropdownOpen.value = true
  panelReady.value = false
  nextTick(updatePanelPosition)
}

function onInput () {
  dropdownOpen.value = true
  updatePanelPosition()
}

function closeDropdown () {
  dropdownOpen.value = false
  panelReady.value = false
  highlightIndex.value = 0
}

function applyPick (pick: LifeCardPick, syncQuery = true) {
  applying.value = true
  modelValue.value = pick
  writeLastLifePick(pick)
  if (syncQuery) query.value = pickToInput(pick)
  applying.value = false
}

function selectItem (item: LifePickSearchItem) {
  applyPick({
    parentId: item.parentId,
    childId: item.childId
  })
  closeDropdown()
}

function moveHighlight (delta: number) {
  if (!dropdownOpen.value || suggestions.value.length === 0) return
  const max = suggestions.value.length - 1
  highlightIndex.value = Math.max(0, Math.min(max, highlightIndex.value + delta))
}

function confirmHighlighted () {
  if (dropdownOpen.value && suggestions.value.length > 0) {
    selectItem(suggestions.value[highlightIndex.value]!)
    return
  }
  commitInput()
}

function commitInput () {
  const raw = query.value.trim()
  if (!raw) {
    modelValue.value = { parentId: '' }
    closeDropdown()
    return
  }

  const exact = suggestions.value.find(item => item.text === raw)
  if (exact) {
    selectItem(exact)
    return
  }

  const pick = ensurePickFromInput(raw)
  if (pick) {
    applyPick(pick)
    closeDropdown()
  }
}

function onBlur () {
  window.setTimeout(() => {
    if (!rootRef.value?.contains(document.activeElement)) {
      commitInput()
      closeDropdown()
    }
  }, 120)
}
</script>

<style scoped>
.life-pick-input {
  @apply rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400;
}

.life-pick-dropdown {
  @apply fixed z-[3000] max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-300/40;
}

.life-pick-option {
  @apply cursor-pointer px-3 py-2.5 text-sm text-slate-700 active:bg-slate-50;
}

.life-pick-option--active {
  @apply bg-indigo-50 text-indigo-700;
}

.life-pick-hint {
  @apply fixed z-[3000] rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500;
}
</style>
