<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <span class="text-white font-bold text-2xl">N</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">欢迎回来</h1>
        <p class="text-slate-500 mt-1">登录你的 Nexus Tools 账号</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <van-form @submit="handleLogin">
          <van-cell-group inset class="!mx-0">
            <van-field
              v-model="form.username"
              name="username"
              placeholder="请输入用户名"
              left-icon="user-o"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="form.password"
              type="password"
              name="password"
              placeholder="请输入密码"
              left-icon="lock"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
          </van-cell-group>

          <div class="mt-6">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !border-0"
            >
              登录
            </van-button>
          </div>
        </van-form>

        <div class="mt-6 flex justify-between text-sm">
          <a href="#" class="text-blue-500 hover:underline">忘记密码？</a>
          <NuxtLink to="/auth/register" class="text-blue-500 hover:underline">
            没有账号？去注册
          </NuxtLink>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-slate-400 hover:text-slate-600 text-sm">
          ← 返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    // TODO: 调用登录 API
    await new Promise(resolve => setTimeout(resolve, 1000))
    navigateTo('/profile')
  } catch (error) {
    // TODO: 显示错误提示
  } finally {
    loading.value = false
  }
}
</script>