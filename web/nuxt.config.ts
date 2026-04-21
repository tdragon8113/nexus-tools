// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@vant/nuxt'
  ],

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      'Noto Serif SC': [400, 600, 700],
      'JetBrains Mono': [400, 500, 600]
    },
    display: 'swap'
  },

  css: ['~~/assets/css/main.css'],

  vant: {
    lazyload: true
  },

  app: {
    head: {
      title: 'Nexus Tools',
      meta: [
        { name: 'description', content: '一站式开发者工具箱，提升你的开发效率' },
        { name: 'keywords', content: '开发者工具,JSON格式化,Base64,时间戳,二维码' },
        { name: 'author', content: 'Nexus Tools' },
        { property: 'og:title', content: 'Nexus Tools - 开发者工具箱' },
        { property: 'og:description', content: '一站式开发者工具箱' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  // 预渲染页面为静态 HTML + 生产优化
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/profile',
        '/tools/json',
        '/manage',
        '/manage/time',
        '/manage/time/clock',
        '/manage/time/timestamp',
        '/manage/time/pomodoro',
        '/manage/time/habits',
        '/manage/time/schedule',
        '/manage/time/stats'
      ]
    },
    compressPublicAssets: true
  },

  vite: {
    build: {
      minify: 'esbuild'
    }
  }
})