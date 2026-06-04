<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import { copyWithToast } from '~/composables/useCopyText'
import {
  buildSearchPreviewLineViews,
  copyToastMessageForPreview,
  searchPreviewHasCopyableLines,
  isTotpSearchPreview,
  type SearchPreviewLineView
} from '~/core/searchPreviewCopy'
import type { SearchPreviewModel } from '~/core/searchPreview'
import type { SearchResultItem } from '~/core/searchResults'

const props = defineProps<{
  preview: SearchPreviewModel | null
  item: SearchResultItem | null
}>()

const lineViews = computed((): SearchPreviewLineView[] =>
  props.preview ? buildSearchPreviewLineViews(props.preview) : []
)

const showCopyHint = computed(
  () => props.preview != null && searchPreviewHasCopyableLines(props.preview)
)

const copyHintText = computed(() =>
  props.preview && isTotpSearchPreview(props.preview) ? '点击验证码复制' : '点击内容复制'
)

function onLineClick(row: SearchPreviewLineView) {
  if (!props.preview || !row.copyText) return
  void copyWithToast(row.copyText, copyToastMessageForPreview(props.preview))
}
</script>

<template>
  <aside
    class="nexus-raycast-detail flex min-h-0 flex-col nexus-raycast-border-l"
    style="-webkit-app-region: no-drag"
  >
    <template v-if="preview">
      <div class="nexus-raycast-border-b px-4 py-3">
        <p class="nexus-raycast-text-secondary nexus-raycast-type-caption font-semibold">{{ preview.title }}</p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p v-if="preview.error" class="nexus-raycast-type-secondary text-red-500">{{ preview.error }}</p>
        <p v-else-if="preview.emptyHint" class="nexus-raycast-text-secondary nexus-raycast-type-secondary">{{ preview.emptyHint }}</p>

        <div v-else class="space-y-3">
          <div v-for="(row, index) in lineViews" :key="index" class="min-w-0">
            <p v-if="row.label" class="nexus-raycast-text-tertiary nexus-raycast-type-caption">{{ row.label }}</p>
            <pre
              class="nexus-raycast-preview-code nexus-raycast-type-secondary mt-1 max-h-[min(18rem,40vh)] overflow-auto whitespace-pre-wrap break-words rounded-lg px-3 py-2"
              :class="[row.mono ? 'font-mono' : '', row.copyable ? 'nexus-raycast-preview-copyable cursor-pointer' : '']"
              :role="row.copyable ? 'button' : undefined"
              :tabindex="row.copyable ? 0 : undefined"
              :title="row.copyable ? '点击复制' : undefined"
              @click.stop="onLineClick(row)"
              @keydown.enter.prevent.stop="onLineClick(row)"
            >{{ row.value }}</pre>
          </div>
          <p v-if="showCopyHint" class="nexus-raycast-text-tertiary nexus-raycast-type-caption">
            {{ copyHintText }}
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="item">
      <div class="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <MacAppIcon
          v-if="item.kind === 'mac-app' && item.app"
          :app-path="item.app.path"
          size="md"
        />
        <div v-else class="flex h-12 w-12 items-center justify-center rounded-xl" :class="item.bgColor">
          <van-icon :name="item.icon" size="22" :class="item.iconColor" />
        </div>
        <div>
          <p class="nexus-raycast-text-primary nexus-raycast-type-body font-semibold">{{ item.title }}</p>
          <p class="nexus-raycast-text-secondary nexus-raycast-type-secondary mt-1">{{ item.subtitle }}</p>
        </div>
        <p class="nexus-raycast-text-tertiary nexus-raycast-type-caption">按 ↵ 打开</p>
      </div>
    </template>

    <div
      v-else
      class="nexus-raycast-text-tertiary nexus-raycast-type-secondary flex flex-1 items-center justify-center px-6 text-center"
    >
      在 Query 中粘贴或输入内容以匹配工具，或选择列表项查看详情
    </div>
  </aside>
</template>
