<template>
  <div class="w-full py-1">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in tagLibrary"
        :key="tag"
        type="button"
        class="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
        :class="selectedSet.has(tag)
          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 text-slate-600 active:bg-slate-50'"
        @click="toggle(tag)"
      >
        {{ tag }}
      </button>
      <button
        type="button"
        class="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors active:bg-slate-50"
        aria-label="添加标签"
        @click="addOpen = true"
      >
        <span class="inline-flex items-center leading-none">
          <van-icon name="plus" size="14" />
        </span>
      </button>
    </div>

    <van-dialog
      v-model:show="addOpen"
      title="新建标签"
      show-cancel-button
      confirm-button-text="添加"
      :before-close="beforeAddClose"
    >
      <van-field
        v-model="draft"
        maxlength="12"
        placeholder="如：特殊记忆"
        class="!pb-2"
      />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import { normalizeTag, useRecordTags } from '~/composables/useRecordTags'

const modelValue = defineModel<string[]>({ default: () => [] })

const { tagLibrary, load, ensureInLibrary } = useRecordTags()

const addOpen = ref(false)
const draft = ref('')

const selectedSet = computed(() => new Set(modelValue.value))

onMounted(load)

watch(addOpen, (open) => {
  if (open) draft.value = ''
})

function toggle (tag: string) {
  const next = new Set(modelValue.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  modelValue.value = [...next]
}

function beforeAddClose (action: 'confirm' | 'cancel') {
  if (action === 'cancel') return true

  const tag = normalizeTag(draft.value)
  if (!tag) {
    showToast('请输入标签名称')
    return false
  }
  if (tagLibrary.value.includes(tag)) {
    showToast('标签已存在，已为你选中')
  } else {
    ensureInLibrary(tag)
  }
  if (!selectedSet.value.has(tag)) {
    modelValue.value = [...modelValue.value, tag]
  }
  return true
}
</script>
