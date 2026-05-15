<script setup lang="ts">
const { user, isLoggedIn, logout } = useAuthApi()

const authed = computed(() => {
  if (user.value) return true
  return isLoggedIn()
})

const handleLogout = async () => {
  await logout()
  await navigateTo('/manage/time')
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md"
  >
    <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2">
      <div class="flex justify-between items-center gap-3 min-w-0">
        <NuxtLink to="/manage/time" class="flex items-center gap-3 min-w-0 group">
          <div
            class="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:opacity-95 transition-opacity"
          >
            <span class="font-display font-semibold text-lg text-white leading-none">N</span>
          </div>
          <div class="min-w-0 text-left">
            <span
              class="block font-display text-lg font-bold tracking-tight truncate bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Nexus Time
            </span>
            <span class="hidden sm:block text-[11px] text-slate-500 leading-tight truncate">
              时间管理 · 登录后同步数据
            </span>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <template v-if="authed">
            <NuxtLink
              to="/profile"
              class="px-2 sm:px-3 py-2 text-sm text-slate-600 hover:text-blue-600 rounded-md hover:bg-blue-50/60 transition-colors"
            >
              个人中心
            </NuxtLink>
            <van-button
              size="small"
              plain
              hairline
              type="primary"
              class="!text-blue-600 !border-slate-300"
              @click="handleLogout"
            >
              退出登录
            </van-button>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="px-3 py-2 text-sm text-slate-600 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              登录
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="px-3 sm:px-4 py-2 text-sm font-medium rounded-full doc-cta-gradient"
            >
              注册
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
