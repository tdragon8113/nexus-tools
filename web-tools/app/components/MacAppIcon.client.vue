<script setup lang="ts">
import { useMacAppIconCache } from '~/composables/useMacAppIconCache'

const props = withDefaults(
  defineProps<{
    appPath: string
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

const failed = ref(false)
const { cache, fetchIcon } = useMacAppIconCache()
let loadGen = 0

const iconSrc = computed(() => cache.value[props.appPath] ?? null)

const boxClass = computed(() =>
  props.size === 'md' ? 'h-16 w-16 rounded-2xl' : 'h-8 w-8 rounded-lg'
)

async function ensureIcon(appPath: string) {
  if (!appPath || cache.value[appPath]) return

  const gen = ++loadGen
  failed.value = false

  try {
    const url = await fetchIcon(appPath)
    if (gen !== loadGen) return
    if (!url) failed.value = true
  } catch {
    if (gen === loadGen) failed.value = true
  }
}

onMounted(() => {
  void ensureIcon(props.appPath)
})

watch(
  () => props.appPath,
  (path) => {
    failed.value = false
    void ensureIcon(path)
  }
)

watch(iconSrc, (url) => {
  if (url) failed.value = false
})

function onImgError() {
  failed.value = true
}
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 text-slate-500"
    :class="boxClass"
  >
    <img
      v-if="iconSrc && !failed"
      :src="iconSrc"
      alt=""
      class="h-full w-full object-contain"
      draggable="false"
      loading="eager"
      @error="onImgError"
    />
    <van-icon v-else name="apps-o" :size="size === 'md' ? 28 : 18" />
  </div>
</template>
