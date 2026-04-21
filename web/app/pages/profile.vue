<template>
  <div class="doc-page-gradient text-slate-900">
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <div v-else-if="user">
      <AppHeader>
        <template #end>
          <van-button size="small" plain hairline type="primary" class="!text-blue-600 !border-slate-300" @click="handleLogout">
            退出登录
          </van-button>
        </template>
      </AppHeader>

      <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <nav class="text-sm text-slate-500 mb-6" aria-label="面包屑">
          <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
          <span class="text-slate-300 mx-2">/</span>
          <span class="text-slate-900 font-medium">个人中心</span>
        </nav>

        <header class="mb-8 pb-6 border-b border-slate-200/80">
          <p class="doc-eyebrow mb-3">账号</p>
          <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900">个人中心</h1>
          <p class="doc-prose-muted mt-2 max-w-xl text-sm sm:text-base">查看并管理你的 Nexus Tools 账号信息。</p>
        </header>

        <div class="doc-surface p-6 md:p-8 rounded-lg mb-6">
          <div class="flex items-center gap-4 md:gap-6">
            <div
              class="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/25 border-2 border-white"
            >
              <van-icon name="user" size="36" class="text-white" />
            </div>
            <div class="min-w-0">
              <h2 class="font-display text-xl font-semibold text-slate-900 truncate">{{ user.username }}</h2>
              <p class="text-slate-600 text-sm mt-1 truncate">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <div class="doc-surface overflow-hidden rounded-lg mb-6">
          <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-display text-base font-semibold text-slate-900">账号信息</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="用户名" :value="user.username" icon="user-o" />
            <van-cell title="邮箱" :value="user.email" icon="envelop-o" />
            <van-cell title="昵称" :value="user.nickname || '未设置'" icon="user-circle-o" />
          </van-cell-group>
        </div>

        <div class="doc-surface overflow-hidden rounded-lg">
          <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
            <h3 class="font-display text-base font-semibold text-slate-900">更多</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="修改密码" icon="lock" is-link />
            <van-cell title="消息通知" icon="bell" is-link />
            <van-cell title="关于我们" icon="info-o" is-link />
          </van-cell-group>
          <div class="p-4 border-t border-slate-100">
            <van-button
              block
              plain
              type="danger"
              @click="showDeleteConfirm = true"
            >
              注销账号
            </van-button>
          </div>
        </div>
      </main>

      <van-dialog
        v-model:show="showDeleteConfirm"
        title="确认注销"
        message="注销后账号数据将无法恢复，确定要注销吗？"
        show-cancel-button
        @confirm="handleDeleteAccount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { user, logout, deleteAccount, getCurrentUser } = useAuthApi()
const userId = useCookie('userId')

const showDeleteConfirm = ref(false)
const loading = ref(false)

onMounted(async () => {
  if (!userId.value) {
    await navigateTo('/auth/login')
    return
  }
  loading.value = true
  try {
    await getCurrentUser()
  } catch (error) {
    await navigateTo('/auth/login')
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  await logout()
  await navigateTo('/')
}

const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    await navigateTo('/')
  } catch (error) {
    // 错误处理
  }
}
</script>
