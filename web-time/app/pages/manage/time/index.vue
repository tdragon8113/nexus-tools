<template>
  <div class="px-4 py-12 text-center">
    <div
      class="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 border border-indigo-100 flex items-center justify-center mb-5"
    >
      <van-icon name="notes-o" size="28" class="text-indigo-600" />
    </div>
    <p class="text-sm text-slate-600 leading-relaxed">
      内容区后续再接。可用底栏切换「统计」「我的」。
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <NuxtLink
        v-if="!authed"
        to="/auth/login"
        class="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium doc-cta-gradient"
      >
        登录
      </NuxtLink>
      <NuxtLink
        to="/profile"
        class="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium border border-slate-200 bg-white text-slate-800 active:bg-slate-50 transition-colors"
      >
        个人中心
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn, user } = useAuthApi()

const authed = computed(() => {
  if (user.value) return true
  return isLoggedIn()
})

useHead({
  title: '浏览 · Nexus Time'
})
</script>
