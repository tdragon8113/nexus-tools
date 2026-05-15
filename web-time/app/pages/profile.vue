<template>
  <div class="relative">
    <div v-if="loading" class="flex items-center justify-center py-24">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <template v-else-if="user">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <PageBreadcrumb
          :items="[
            { to: '/manage/time', label: '概览' },
            { label: '个人中心' }
          ]"
        />

        <PageHero
          :show-icon="false"
          eyebrow="账号"
          title="个人中心"
          description="查看并管理你的 Nexus Tools 账号信息。"
        />

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
      </div>

      <van-dialog
        v-model:show="showDeleteConfirm"
        title="确认注销"
        message="注销后账号数据将无法恢复，确定要注销吗？"
        show-cancel-button
        @confirm="handleDeleteAccount"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
const { user, deleteAccount, getCurrentUser, isLoggedIn } = useAuthApi()

const showDeleteConfirm = ref(false)
const loading = ref(false)

onMounted(async () => {
  // 等待客户端初始化
  await nextTick()
  console.log('[Profile] isLoggedIn:', isLoggedIn())

  if (!isLoggedIn()) {
    console.log('[Profile] Not logged in, redirecting to login')
    await navigateTo('/auth/login')
    return
  }
  loading.value = true
  try {
    await getCurrentUser()
  } catch (error) {
    console.log('[Profile] getCurrentUser failed:', error)
    await navigateTo('/auth/login')
  } finally {
    loading.value = false
  }
})

const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    await navigateTo('/')
  } catch (error) {
    // 错误处理
  }
}
</script>
