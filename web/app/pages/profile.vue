<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-100">
      <div class="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">N</span>
          </div>
          <span class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Nexus Tools
          </span>
        </NuxtLink>
        <van-button size="small" plain type="primary" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </header>

    <!-- Main Content -->
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
          <van-cell title="注册时间" :value="user.createdAt" icon="clock-o" />
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const user = reactive({
  username: 'testuser',
  email: 'test@example.com',
  createdAt: '2026-04-10'
})

const showDeleteConfirm = ref(false)

const handleLogout = () => {
  // TODO: 清除登录状态
  navigateTo('/')
}

const handleDeleteAccount = () => {
  // TODO: 调用注销 API
  navigateTo('/')
}
</script>