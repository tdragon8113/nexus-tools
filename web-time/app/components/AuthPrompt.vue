<template>
  <div class="doc-surface p-4 flex items-start gap-3">
    <van-icon name="info-o" size="20" class="text-indigo-500 shrink-0 mt-0.5" />
    <div class="min-w-0 flex-1">
      <p class="text-sm text-slate-700">{{ message }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          :to="loginTo"
          class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium doc-cta-gradient"
        >
          登录
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-800"
        >
          注册
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  message?: string
  redirect?: string
}>(), {
  message: '登录后，你的生活记录会保存在云端并在此回显',
  redirect: '/manage/time'
})

const loginTo = computed(() =>
  `/auth/login?redirect=${encodeURIComponent(props.redirect)}`
)
</script>
