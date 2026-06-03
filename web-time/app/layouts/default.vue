<script setup lang="ts">
import { BACK_FALLBACKS } from '~/composables/useBackNavigation'

const route = useRoute()

const hideTabBar = computed(() => route.path in BACK_FALLBACKS)

const mainPadding = computed(() =>
  hideTabBar.value
    ? 'pb-[env(safe-area-inset-bottom,0px)]'
    : 'pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]'
)
</script>

<template>
  <div class="doc-page-shell doc-page-gradient text-slate-900 min-h-screen flex flex-col">
    <a href="#main-content" class="doc-skip-link">跳到主内容</a>
    <AppHeader />
    <main
      id="main-content"
      class="flex-1 min-w-0 w-full outline-none"
      :class="mainPadding"
      tabindex="-1"
    >
      <slot />
    </main>
    <MobileTabBar v-if="!hideTabBar" />
    <QuickSwitchSheet />
  </div>
</template>
