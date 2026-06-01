<template>
  <div class="w-full flex flex-col">
    <div class="text-center mb-8">
      <AppBrandMark variant="auth" class="mx-auto mb-5" />
      <p class="doc-eyebrow mb-2">账号</p>
      <h1 class="font-sans text-2xl font-semibold text-slate-900">欢迎回来</h1>
      <p class="text-slate-600 mt-2 text-sm">登录以使用个人中心等功能。</p>
    </div>

    <div class="doc-surface p-5">
      <div
        v-if="errorMessage"
        class="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm text-center"
      >
        {{ errorMessage }}
      </div>

      <van-form @submit.prevent="handleLogin">
        <van-cell-group inset class="!mx-0">
          <van-field
            v-model="form.username"
            name="username"
            placeholder="用户名"
            left-icon="user-o"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            placeholder="密码"
            left-icon="lock"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="mt-5">
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

      <div class="mt-5 flex flex-col gap-2 text-sm text-center">
        <NuxtLink to="/auth/register" class="text-blue-600 font-medium">
          没有账号？去注册
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

const { login, getCurrentUser } = useAuthApi()
const { sync: syncAuth } = useAuthSession()
const route = useRoute()

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await login(form.username, form.password)
    if (response.code === 200) {
      syncAuth()
      await getCurrentUser()
      showToast('登录成功')
      const redirect = typeof route.query.redirect === 'string'
        ? route.query.redirect
        : '/manage/time'
      await navigateTo(redirect)
    } else if (response.code === 0) {
      errorMessage.value = '无法连接服务器，请确认后端与 /api 代理正常'
    } else {
      errorMessage.value = response.message || '登录失败'
    }
  } catch {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
