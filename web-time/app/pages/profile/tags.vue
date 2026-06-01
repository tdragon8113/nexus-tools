<template>
  <div class="px-4 py-4 space-y-4">
    <p class="text-sm text-slate-600 leading-relaxed">
      管理写记录时可选的标签。在此添加或删除，写记录时只需点选。
    </p>

    <div class="doc-surface overflow-hidden">
      <div v-if="tagLibrary.length === 0" class="py-10 px-4 text-center">
        <p class="text-sm text-slate-500">还没有标签</p>
        <p class="text-xs text-slate-400 mt-1">在下方添加第一个标签</p>
      </div>

      <van-cell-group v-else :border="false">
        <van-swipe-cell v-for="tag in tagLibrary" :key="tag">
          <van-cell :title="tag" />
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              class="!h-full"
              @click="confirmRemove(tag)"
            />
          </template>
        </van-swipe-cell>
      </van-cell-group>

      <div class="p-3 border-t border-slate-100 space-y-2">
        <div class="flex gap-2">
          <input
            v-model="draft"
            type="text"
            class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 placeholder:text-slate-400"
            placeholder="新建标签，如：特殊记忆"
            maxlength="12"
            @keydown.enter.prevent="addDraft"
          >
          <van-button size="small" type="primary" class="!border-0 !bg-indigo-600 shrink-0" @click="addDraft">
            添加
          </van-button>
        </div>
        <van-button block plain type="default" @click="handleReset">
          恢复默认
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showConfirmDialog, showToast } from 'vant'
import { DEFAULT_RECORD_TAGS, normalizeTag, useRecordTags } from '~/composables/useRecordTags'

definePageMeta({
  layout: 'default'
})

useHead({ title: '记录标签 · Nexus Time' })

const { tagLibrary, load, ensureInLibrary, removeFromLibrary, resetToDefaults } = useRecordTags()
const draft = ref('')

onMounted(load)

function addDraft () {
  const tag = normalizeTag(draft.value)
  if (!tag) {
    showToast('请输入标签名称')
    return
  }
  if (tagLibrary.value.includes(tag)) {
    showToast('标签已存在')
    return
  }
  ensureInLibrary(tag)
  draft.value = ''
  showToast('已添加')
}

async function confirmRemove (tag: string) {
  try {
    await showConfirmDialog({
      title: '删除标签',
      message: `确定删除「${tag}」吗？已有记录上的标签不会自动清除。`
    })
    removeFromLibrary(tag)
    showToast('已删除')
  } catch {
    // cancelled
  }
}

async function handleReset () {
  try {
    await showConfirmDialog({
      title: '恢复默认',
      message: `将标签恢复为：${DEFAULT_RECORD_TAGS.join('、')}`
    })
    resetToDefaults()
    showToast('已恢复默认')
  } catch {
    // cancelled
  }
}
</script>
