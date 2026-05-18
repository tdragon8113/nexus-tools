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
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'
    }
  },

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700]
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
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        { name: 'theme-color', content: '#4f46e5' },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes'
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'default'
        },
        { name: 'description', content: 'Nexus Time：账号登录与个人中心' },
        { name: 'keywords', content: 'Nexus Time,账号' },
        { name: 'author', content: 'Nexus Tools' },
        { property: 'og:title', content: 'Nexus Time' },
        { property: 'og:description', content: 'Nexus Time 站点' }
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
    },
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit']
    }
  },

  devServer: {
    port: 3001
  }
})
