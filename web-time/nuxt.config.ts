// https://nuxt.com/docs/api/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  routeRules: {
    '/': { redirect: { to: '/manage/time', statusCode: 302 } },
    '/manage': { redirect: { to: '/manage/time', statusCode: 301 } }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@vant/nuxt'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      /** 小工具站点（纯静态）基址 */
      toolsAppUrl: process.env.NUXT_PUBLIC_TOOLS_APP_URL || 'http://localhost:3000'
    }
  },

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
      title: 'Nexus Time',
      meta: [
        { name: 'description', content: '时间管理：番茄钟、日程与习惯，支持登录同步' },
        { name: 'keywords', content: '时间管理,番茄钟,日程,习惯' },
        { name: 'author', content: 'Nexus Tools' },
        { property: 'og:title', content: 'Nexus Time' },
        { property: 'og:description', content: '时间管理工作台' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/manage/time',
        '/manage/time/clock',
        '/manage/time/timestamp',
        '/manage/time/pomodoro',
        '/manage/time/habits',
        '/manage/time/schedule',
        '/manage/time/stats',
        '/auth/login',
        '/auth/register',
        '/profile'
      ]
    },
    compressPublicAssets: true
  },

  vite: {
    build: {
      minify: 'esbuild'
    }
  },

  devServer: {
    port: 3001
  }
})
