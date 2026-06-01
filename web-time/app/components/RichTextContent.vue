<template>
  <div
    class="rich-text"
    :class="compact ? 'rich-text--compact' : ''"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { renderSimpleMarkdown } from '~/utils/richText'

const props = defineProps<{
  source: string
  compact?: boolean
}>()

const html = computed(() => renderSimpleMarkdown(props.source))
</script>

<style scoped>
.rich-text :deep(.rich-p) {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgb(71 85 105);
}

.rich-text--compact :deep(.rich-p),
.rich-text--compact :deep(.rich-heading),
.rich-text--compact :deep(.rich-quote),
.rich-text--compact :deep(.rich-list) {
  font-size: 0.75rem;
  line-height: 1.45;
}

.rich-text :deep(.rich-p:last-child),
.rich-text :deep(.rich-list:last-child),
.rich-text :deep(.rich-quote:last-child),
.rich-text :deep(.rich-heading:last-child) {
  margin-bottom: 0;
}

.rich-text :deep(.rich-heading) {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.rich-text :deep(.rich-list) {
  margin: 0 0 0.35rem;
  padding-left: 1rem;
  list-style: disc;
  color: rgb(71 85 105);
}

.rich-text :deep(.rich-list li) {
  margin: 0.125rem 0;
}

.rich-text :deep(.rich-quote) {
  margin: 0 0 0.35rem;
  padding-left: 0.625rem;
  border-left: 2px solid rgb(199 210 254);
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.rich-text :deep(.rich-hr) {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px dashed rgb(226 232 240);
}
</style>
