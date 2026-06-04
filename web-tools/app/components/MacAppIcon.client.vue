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
const iconSrc = ref<string | null>(null)
const { fetchIcon } = useMacAppIconCache()
let loadGen = 0

const boxClass = computed(() =>
  props.size === 'md' ? 'h-16 w-16 rounded-2xl' : 'h-8 w-8 rounded-lg'
)

async function loadIcon(appPath: string) {
  const gen = ++loadGen
  iconSrc.value = null
  failed.value = false

  const url = await fetchIcon(appPath)
  if (gen !== loadGen) return
  if (url) iconSrc.value = url
  else failed.value = true
}

onMounted(() => {
  void loadIcon(props.appPath)
})

watch(
  () => props.appPath,
  (path) => {
    void loadIcon(path)
  }
)

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
      @error="onImgError"
    />
    <van-icon v-else name="apps-o" :size="size === 'md' ? 28 : 18" />
  </div>
</template>
