<template>
  <div class="relative">
    <div v-if="loading" class="flex justify-center items-center py-24">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <template v-else-if="user">
      <div class="px-4 py-4 space-y-4">
        <div class="doc-surface p-5">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 border-2 border-white"
            >
              <van-icon name="user" size="32" class="text-white" />
            </div>
            <div class="min-w-0">
              <h2 class="font-sans text-lg font-semibold text-slate-900 truncate">{{ user.username }}</h2>
              <p class="text-slate-600 text-sm mt-1 truncate">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <div class="doc-surface overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-sans text-sm font-semibold text-slate-900">账号信息</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="用户名" :value="user.username" icon="user-o" />
            <van-cell title="邮箱" :value="user.email" icon="envelop-o" />
            <van-cell title="昵称" :value="user.nickname || '未设置'" icon="user-circle-o" />
          </van-cell-group>
        </div>

        <div class="doc-surface overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-sans text-sm font-semibold text-slate-900">更多</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="修改密码" icon="lock" is-link />
            <van-cell title="消息通知" icon="bell" is-link />
            <van-cell title="关于我们" icon="info-o" is-link />
          </van-cell-group>
          <div class="p-3 border-t border-slate-100">
            <van-button block plain type="danger" @click="showDeleteConfirm = true">
              注销账号
            </van-button>
          </div>
        </div>
      </div>

      <van-dialog
        v-model:show="showDeleteConfirm"
        title="确认注销"
        message="注销后账号数据将无法恢复，确定要注销吗？"
        show-cancel-button
        @confirm="handleDeleteAccount"
      />
    </template>

    <div v-else class="px-4 py-12 text-center">
      <div
        class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4"
      >
        <van-icon name="user-o" size="28" class="text-slate-500" />
      </div>
      <h1 class="font-sans text-lg font-semibold text-slate-900 leading-normal">
        我的
      </h1>
      <p class="mt-2 text-sm text-slate-600 leading-relaxed">
        登录后可查看并管理账号信息。
      </p>
      <div class="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
        <NuxtLink
          to="/auth/login"
          class="inline-flex justify-center items-center rounded-full px-6 py-3 text-sm font-medium doc-cta-gradient"
        >
          登录
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="inline-flex justify-center items-center rounded-full px-6 py-3 text-sm font-medium border border-slate-200 bg-white text-slate-800 active:bg-slate-50 transition-colors"
        >
          注册
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '我的 · Nexus Time'
})

const { user, deleteAccount, getCurrentUser, getAccessToken } = useAuthApi()

const showDeleteConfirm = ref(false)
const loading = ref(true)

onMounted(async () => {
  await nextTick()
  if (!getAccessToken()) {
    loading.value = false
    return
  }
  try {
    const res = await getCurrentUser()
    if (res.code !== 200 || !res.data) {
      await navigateTo('/auth/login')
    }
  } catch {
    await navigateTo('/auth/login')
  } finally {
    loading.value = false
  }
})

const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    await navigateTo('/manage/time')
  } catch {
    // 错误处理
  }
}
</script>
