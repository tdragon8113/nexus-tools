<template>
  <div class="w-full flex flex-col">
    <div class="text-center mb-8">
      <AppBrandMark variant="auth" class="mx-auto mb-5" />
      <p class="doc-eyebrow mb-2">账号</p>
      <h1 class="font-sans text-2xl font-semibold text-slate-900">创建账号</h1>
      <p class="text-slate-600 mt-2 text-sm">注册后可使用个人中心与后续同步能力。</p>
    </div>

    <div class="doc-surface p-5">
      <div
        v-if="errorMessage"
        class="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm text-center"
      >
        {{ errorMessage }}
      </div>

      <van-cell-group inset class="!mx-0">
        <van-field
          v-model="form.username"
          name="username"
          placeholder="用户名"
          left-icon="user-o"
        />
        <van-field
          v-model="form.email"
          name="email"
          placeholder="邮箱"
          left-icon="envelop-o"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          placeholder="密码（至少 6 位）"
          left-icon="lock"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          placeholder="再次输入密码"
          left-icon="lock"
        />
      </van-cell-group>

      <div class="mt-5">
        <van-button
          round
          block
          type="primary"
          :loading="loading"
          class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !border-0"
          @click="handleRegister"
        >
          注册
        </van-button>
      </div>

      <div class="mt-5 text-center text-sm">
        <NuxtLink to="/auth/login" class="text-blue-600 font-medium">
          已有账号？去登录
        </NuxtLink>
      </div>
    </div>

    <div class="text-center mt-6">
      <NuxtLink to="/manage/time" class="text-sm text-slate-500">
        返回首页
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'

definePageMeta({
  layout: 'auth'
})

const { register, login, getCurrentUser } = useAuthApi()
const { sync: syncAuth } = useAuthSession()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const handleRegister = async () => {
  const username = form.username.trim()
  const email = form.email.trim()
  const password = form.password

  if (!username) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!email) {
    errorMessage.value = '请输入邮箱'
    return
  }
  if (!emailPattern.test(email)) {
    errorMessage.value = '邮箱格式不正确'
    return
  }
  if (!password || password.length < 6) {
    errorMessage.value = '密码至少 6 位'
    return
  }
  if (password !== form.confirmPassword) {
    errorMessage.value = '两次密码不一致'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await register(username, email, password)
    if (response.code === 200) {
      const loginRes = await login(username, password)
      if (loginRes.code === 200) {
        syncAuth()
        await getCurrentUser()
        showToast('注册并登录成功')
        await navigateTo('/manage/time')
        return
      }
      showToast('注册成功，请登录')
      await navigateTo('/auth/login')
    } else if (response.code === 0) {
      errorMessage.value = '无法连接服务器，请确认后端与 /api 代理正常'
    } else {
      errorMessage.value = response.message || '注册失败'
    }
  } catch (e) {
    console.error('[Auth] Register failed:', e)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
