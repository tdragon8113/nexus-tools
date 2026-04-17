<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <AppHeader />

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
        <button
          v-for="tool in siteTools"
          :key="tool.id"
          type="button"
          class="group p-5 flex flex-col items-center text-center rounded-2xl border border-slate-100/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
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
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center py-8 text-slate-400 text-sm">
      <p>© 2026 Nexus Tools. Made with ❤️ for developers.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant'
import { siteTools, type SiteTool } from '~~/data/siteTools'

definePageMeta({
  layout: false
})

const handleToolClick = (tool: SiteTool) => {
  if (tool.path) {
    void navigateTo(tool.path)
    return
  }
  showToast('该工具即将上线')
}
</script>
