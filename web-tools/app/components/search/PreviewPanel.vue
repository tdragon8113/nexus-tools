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

const previewHasBody = computed(
  () =>
    Boolean(props.preview?.error) ||
    lineViews.value.length > 0 ||
    Boolean(props.preview?.emptyHint)
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
    class="nexus-raycast-detail flex min-h-0 flex-1 flex-col nexus-raycast-border-l"
    style="-webkit-app-region: no-drag"
  >
    <!-- 有 Query 预览内容 -->
    <template v-if="preview && previewHasBody">
      <div class="nexus-raycast-border-b flex shrink-0 items-center gap-3 px-4 py-3">
        <div
          v-if="item && item.kind === 'tool'"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          :class="item.bgColor"
        >
          <van-icon :name="item.icon" size="18" :class="item.iconColor" />
        </div>
        <MacAppIcon
          v-else-if="item?.kind === 'mac-app' && item.app"
          :app-path="item.app.path"
          size="sm"
        />
        <p class="nexus-raycast-text-primary nexus-raycast-type-body min-w-0 flex-1 truncate font-semibold">
          {{ preview.title }}
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <p v-if="preview.error" class="nexus-raycast-type-secondary text-red-500">{{ preview.error }}</p>
        <p v-else-if="preview.emptyHint" class="nexus-raycast-text-secondary nexus-raycast-type-secondary">
          {{ preview.emptyHint }}
        </p>

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

    <!-- 选中列表项、尚无 Query 预览 -->
    <template v-else-if="item">
      <div class="nexus-raycast-border-b flex shrink-0 items-center gap-3 px-4 py-3">
        <MacAppIcon
          v-if="item.kind === 'mac-app' && item.app"
          :app-path="item.app.path"
          size="sm"
        />
        <div
          v-else
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          :class="item.bgColor"
        >
          <van-icon :name="item.icon" size="18" :class="item.iconColor" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="nexus-raycast-text-primary nexus-raycast-type-body truncate font-semibold">{{ item.title }}</p>
          <p class="nexus-raycast-text-secondary nexus-raycast-type-secondary truncate">{{ item.subtitle }}</p>
        </div>
        <span class="nexus-raycast-text-tertiary nexus-raycast-type-caption shrink-0">{{ item.badge }}</span>
      </div>

      <div class="shrink-0 px-4 py-3">
        <p class="nexus-raycast-text-tertiary nexus-raycast-type-caption leading-relaxed">
          <template v-if="item.kind === 'mac-app'">按 ↵ 打开应用</template>
          <template v-else>在 Query 中粘贴内容可即时预览；按 ↵ 打开工具</template>
        </p>
      </div>
    </template>

    <div
      v-else
      class="nexus-raycast-text-tertiary nexus-raycast-type-secondary shrink-0 px-4 py-3 leading-relaxed"
    >
      在 Query 中粘贴或输入内容以匹配工具，或选择列表项查看详情
    </div>

    <div
      v-if="item"
      class="nexus-raycast-footer mt-auto flex shrink-0 items-center justify-end gap-1.5 border-t border-[var(--nexus-raycast-border)] px-4 py-2"
    >
      <span class="nexus-raycast-text-secondary nexus-raycast-type-caption">打开</span>
      <kbd class="nexus-raycast-kbd">↵</kbd>
    </div>
  </aside>
</template>
