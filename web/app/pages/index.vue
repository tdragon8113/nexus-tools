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
        <nav class="flex items-center gap-3">
          <NuxtLink
            to="/auth/login"
            class="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            登录
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            注册
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
        开发者工具箱
      </h1>
      <p class="text-slate-500 text-lg max-w-xl mx-auto">
        一站式开发工具集，提升你的开发效率
      </p>
    </section>

    <!-- Tools Grid -->
    <main class="max-w-5xl mx-auto px-4 pb-12">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="tool in tools"
          :key="tool.name"
          class="tool-card p-5 flex flex-col items-center text-center"
          @click="handleToolClick(tool)"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            :class="tool.bgColor"
          >
            <van-icon :name="tool.icon" size="24" :class="tool.iconColor" />
          </div>
          <span class="text-sm font-medium text-slate-700">{{ tool.name }}</span>
          <span class="text-xs text-slate-400 mt-1">{{ tool.desc }}</span>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center py-8 text-slate-400 text-sm">
      <p>© 2026 Nexus Tools. Made with ❤️ for developers.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const tools = [
  { name: 'JSON 格式化', desc: '美化/压缩', icon: 'description', bgColor: 'bg-blue-100', iconColor: 'text-blue-500' },
  { name: 'Base64', desc: '编解码', icon: 'shield-o', bgColor: 'bg-green-100', iconColor: 'text-green-500' },
  { name: '时间戳', desc: '时间转换', icon: 'clock-o', bgColor: 'bg-orange-100', iconColor: 'text-orange-500' },
  { name: '二维码', desc: '生成解析', icon: 'qr', bgColor: 'bg-purple-100', iconColor: 'text-purple-500' },
  { name: '颜色转换', desc: 'HEX/RGB', icon: 'brush-o', bgColor: 'bg-pink-100', iconColor: 'text-pink-500' },
  { name: '正则测试', desc: 'Regex', icon: 'search', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-500' },
  { name: 'HTTP 请求', desc: 'API 测试', icon: 'cluster-o', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-500' },
  { name: 'UUID', desc: '唯一标识', icon: 'gift-o', bgColor: 'bg-amber-100', iconColor: 'text-amber-500' },
  { name: 'MD5/SHA', desc: '哈希计算', icon: 'lock', bgColor: 'bg-red-100', iconColor: 'text-red-500' },
  { name: 'URL 编码', desc: '编解码', icon: 'link-o', bgColor: 'bg-teal-100', iconColor: 'text-teal-500' },
  { name: '代码格式化', desc: 'Prettier', icon: 'coupon-o', bgColor: 'bg-violet-100', iconColor: 'text-violet-500' },
  { name: '更多工具', desc: 'Coming soon', icon: 'apps-o', bgColor: 'bg-slate-100', iconColor: 'text-slate-500' },
]

const handleToolClick = (tool: typeof tools[0]) => {
  // TODO: 跳转到具体工具页面
  console.log('Tool clicked:', tool.name)
}
</script>