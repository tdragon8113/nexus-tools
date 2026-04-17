<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- Main Content -->
    <div v-else-if="user">
      <AppHeader>
        <template #end>
          <van-button size="small" plain type="primary" @click="handleLogout">
            退出登录
          </van-button>
        </template>
      </AppHeader>

      <main class="max-w-5xl mx-auto p-4 md:p-8">
        <!-- User Card -->
        <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <van-icon name="user" size="32" class="text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ user.username }}</h2>
              <p class="text-slate-500">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <!-- Info Section -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">账号信息</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="用户名" :value="user.username" icon="user-o" />
            <van-cell title="邮箱" :value="user.email" icon="envelop-o" />
            <van-cell title="昵称" :value="user.nickname || '未设置'" icon="user-circle-o" />
          </van-cell-group>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">账号操作</h3>
          </div>
          <van-cell-group :border="false">
            <van-cell title="修改密码" icon="lock" is-link />
            <van-cell title="消息通知" icon="bell" is-link />
            <van-cell title="关于我们" icon="info-o" is-link />
          </van-cell-group>
          <div class="p-4">
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

      <!-- Delete Confirm Dialog -->
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

// 检查登录状态并获取用户信息
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