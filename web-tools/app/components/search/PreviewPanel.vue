<script setup lang="ts">
import MacAppIcon from '~/components/MacAppIcon.client.vue'
import type { SearchPreviewModel } from '~/core/searchPreview'
import type { SearchResultItem } from '~/core/searchResults'

defineProps<{
  preview: SearchPreviewModel | null
  item: SearchResultItem | null
}>()
</script>

<template>
  <aside
    class="nexus-raycast-detail flex min-h-0 flex-col nexus-raycast-border-l"
    style="-webkit-app-region: no-drag"
  >
    <template v-if="preview">
      <div class="nexus-raycast-border-b px-4 py-3">
        <p class="nexus-raycast-text-secondary text-xs font-semibold">{{ preview.title }}</p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p v-if="preview.error" class="text-sm text-red-500">{{ preview.error }}</p>
        <p v-else-if="preview.emptyHint" class="nexus-raycast-text-secondary text-sm">{{ preview.emptyHint }}</p>

        <div v-else class="space-y-3">
          <div v-for="(line, index) in preview.lines" :key="index" class="min-w-0">
            <p v-if="line.label" class="nexus-raycast-text-tertiary text-[11px]">{{ line.label }}</p>
            <pre
              class="nexus-raycast-preview-code mt-1 max-h-[min(18rem,40vh)] overflow-auto whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-xs"
              :class="line.mono ? 'font-mono' : ''"
            >{{ line.value }}</pre>
          </div>
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
        <div v-else class="flex h-16 w-16 items-center justify-center rounded-2xl" :class="item.bgColor">
          <van-icon :name="item.icon" size="28" :class="item.iconColor" />
        </div>
        <div>
          <p class="nexus-raycast-text-primary text-base font-semibold">{{ item.title }}</p>
          <p class="nexus-raycast-text-secondary mt-1 text-sm">{{ item.subtitle }}</p>
        </div>
        <p class="nexus-raycast-text-tertiary text-xs">按 ↵ 执行 · ⌘K 更多操作</p>
      </div>
    </template>

    <div v-else class="nexus-raycast-text-tertiary flex flex-1 items-center justify-center px-6 text-center text-sm">
      选择一项以查看详情
    </div>
  </aside>
</template>
