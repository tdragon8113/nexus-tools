<template>
  <div
    class="markdown-preview-pane h-full min-h-0 overflow-auto rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
  >
    <div v-if="rendering" class="text-xs text-slate-400">渲染中…</div>
    <div
      v-else-if="!source.trim()"
      class="flex h-full min-h-[8rem] items-center justify-center text-sm text-slate-400"
    >
      预览将显示在此处
    </div>
    <article v-else class="markdown-preview" v-html="html" />
  </div>
</template>

<script setup lang="ts">
import { renderMarkdownToHtml } from '~/utils/markdownPreview'

const props = defineProps<{
  source: string
}>()

const html = ref('')
const rendering = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

async function renderNow(source: string) {
  const id = ++requestId
  rendering.value = true
  try {
    const next = await renderMarkdownToHtml(source)
    if (id === requestId) html.value = next
  } catch {
    if (id === requestId) html.value = '<p class="md-preview-error">预览渲染失败</p>'
  } finally {
    if (id === requestId) rendering.value = false
  }
}

function scheduleRender(source: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void renderNow(source)
  }, 200)
}

watch(
  () => props.source,
  (source) => {
    scheduleRender(source)
  },
  { immediate: true }
)

onMounted(() => {
  void renderNow(props.source)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin: 1.1em 0 0.45em;
  font-weight: 700;
  line-height: 1.3;
  color: rgb(15 23 42);
}

.markdown-preview :deep(h1) {
  font-size: 1.5rem;
  border-bottom: 1px solid rgb(226 232 240);
  padding-bottom: 0.35em;
}

.markdown-preview :deep(h2) {
  font-size: 1.25rem;
  border-bottom: 1px solid rgb(241 245 249);
  padding-bottom: 0.25em;
}

.markdown-preview :deep(h3) {
  font-size: 1.1rem;
}

.markdown-preview :deep(p),
.markdown-preview :deep(li) {
  margin: 0.55em 0;
  line-height: 1.65;
  color: rgb(51 65 85);
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0.55em 0;
  padding-left: 1.35em;
}

.markdown-preview :deep(blockquote) {
  margin: 0.75em 0;
  padding: 0.35em 0.85em;
  border-left: 3px solid rgb(168 162 158);
  color: rgb(100 116 139);
  background: rgb(255 255 255 / 0.65);
}

.markdown-preview :deep(code) {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.88em;
  padding: 0.12em 0.35em;
  border-radius: 0.35rem;
  background: rgb(241 245 249);
  color: rgb(10 111 74);
}

.markdown-preview :deep(pre) {
  margin: 0.75em 0;
  padding: 0.75rem 0.9rem;
  overflow: auto;
  border-radius: 0.65rem;
  background: rgb(15 23 42);
  color: rgb(248 250 252);
}

.markdown-preview :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-preview :deep(a) {
  color: rgb(9 105 218);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-preview :deep(hr) {
  margin: 1.25em 0;
  border: none;
  border-top: 1px solid rgb(226 232 240);
}

.markdown-preview :deep(table) {
  width: 100%;
  margin: 0.75em 0;
  border-collapse: collapse;
  font-size: 0.9em;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid rgb(226 232 240);
  padding: 0.4em 0.6em;
}

.markdown-preview :deep(th) {
  background: rgb(248 250 252);
  font-weight: 600;
}

.markdown-preview :deep(.md-preview-error) {
  color: rgb(220 38 38);
}
</style>
