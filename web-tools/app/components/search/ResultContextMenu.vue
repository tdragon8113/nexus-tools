<script setup lang="ts">
import type { SearchResultItem } from '~/core/searchResults'

const props = defineProps<{
  open: boolean
  x: number
  y: number
  item: SearchResultItem | null
  favorited: boolean
}>()

const emit = defineEmits<{
  close: []
  toggleFavorite: []
}>()

const menuRef = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    void nextTick(() => {
      const el = menuRef.value
      if (!el) return
      const pad = 8
      const rect = el.getBoundingClientRect()
      let left = props.x
      let top = props.y
      if (left + rect.width > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - rect.width - pad)
      }
      if (top + rect.height > window.innerHeight - pad) {
        top = Math.max(pad, window.innerHeight - rect.height - pad)
      }
      el.style.left = `${left}px`
      el.style.top = `${top}px`
    })
  }
)

function onWindowPointerDown(event: MouseEvent) {
  if (!props.open) return
  const el = menuRef.value
  if (el?.contains(event.target as Node)) return
  emit('close')
}

onMounted(() => document.addEventListener('mousedown', onWindowPointerDown, true))
onUnmounted(() => document.removeEventListener('mousedown', onWindowPointerDown, true))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      ref="menuRef"
      class="nexus-raycast-actions-menu fixed z-[151] min-w-[10.5rem] overflow-hidden rounded-xl border shadow-2xl"
      style="-webkit-app-region: no-drag"
      role="menu"
      @contextmenu.prevent
    >
      <button
        type="button"
        role="menuitem"
        class="nexus-raycast-actions-item nexus-raycast-text-primary flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
        @mousedown.prevent
        @click="emit('toggleFavorite')"
      >
        <van-icon :name="favorited ? 'star' : 'star-o'" size="16" class="text-amber-500" />
        {{ favorited ? '从收藏移除' : '添加到收藏' }}
      </button>
    </div>
  </Teleport>
</template>
