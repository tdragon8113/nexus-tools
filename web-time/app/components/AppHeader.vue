<script setup lang="ts">
import { BACK_FALLBACKS, parseBackQuery } from '~/composables/useBackNavigation'

const route = useRoute()
const pageTitle = usePageTitle()

const showBack = computed(() => route.path in BACK_FALLBACKS)

const backTarget = computed(() => {
  const fromQuery = parseBackQuery(route.query)
  if (fromQuery) return fromQuery
  return BACK_FALLBACKS[route.path] ?? '/manage/time'
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]"
  >
    <div
      class="mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 min-h-11"
    >
      <NuxtLink
        v-if="showBack"
        :to="backTarget"
        class="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100"
        aria-label="返回"
      >
        <van-icon name="arrow-left" size="20" />
      </NuxtLink>
      <NuxtLink
        v-else
        to="/manage/time"
        class="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/50"
        aria-label="返回记录"
      >
        <AppBrandMark variant="header" />
      </NuxtLink>

      <h1 class="min-w-0 font-sans text-base font-semibold text-slate-900 text-center truncate leading-normal">
        {{ pageTitle }}
      </h1>

      <div class="w-9 shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  </header>
</template>
