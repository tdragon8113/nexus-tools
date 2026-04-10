<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <span class="text-white font-bold text-2xl">N</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">创建账号</h1>
        <p class="text-slate-500 mt-1">开始使用 Nexus Tools</p>
      </div>

      <!-- Register Form -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <van-form @submit="handleRegister">
          <van-cell-group inset class="!mx-0">
            <van-field
              v-model="form.username"
              name="username"
              placeholder="请输入用户名"
              left-icon="user-o"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="form.email"
              name="email"
              placeholder="请输入邮箱"
              left-icon="envelop-o"
              :rules="[
                { required: true, message: '请输入邮箱' },
                { pattern: emailPattern, message: '邮箱格式不正确' }
              ]"
            />
            <van-field
              v-model="form.password"
              type="password"
              name="password"
              placeholder="请输入密码（至少6位）"
              left-icon="lock"
              :rules="[
                { required: true, message: '请输入密码' },
                { pattern: /^.{6,}$/, message: '密码至少6位' }
              ]"
            />
            <van-field
              v-model="form.confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="请再次输入密码"
              left-icon="lock"
              :rules="[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword, message: '两次密码不一致' }
              ]"
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
              注册
            </van-button>
          </div>
        </van-form>

        <div class="mt-6 text-center text-sm">
          <NuxtLink to="/auth/login" class="text-blue-500 hover:underline">
            已有账号？去登录
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
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateConfirmPassword = (val: string) => val === form.password

const handleRegister = async () => {
  loading.value = true
  try {
    // TODO: 调用注册 API
    await new Promise(resolve => setTimeout(resolve, 1000))
    navigateTo('/auth/login')
  } catch (error) {
    // TODO: 显示错误提示
  } finally {
    loading.value = false
  }
}
</script>