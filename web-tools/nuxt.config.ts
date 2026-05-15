export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@vant/nuxt'
  ],

  runtimeConfig: {
    public: {
      /** 时间管理站点基址（生产换为实际域名/端口） */
      timeAppUrl: process.env.NUXT_PUBLIC_TIME_APP_URL || 'http://localhost:3001'
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
      title: 'Nexus Tools',
      meta: [
        { name: 'description', content: '开发者工具：JSON 格式化等，纯浏览器端处理' },
        { name: 'keywords', content: '开发者工具,JSON格式化,JSON' },
        { name: 'author', content: 'Nexus Tools' },
        { property: 'og:title', content: 'Nexus Tools - 小工具' },
        { property: 'og:description', content: '开发者小工具，无需上传数据' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/tools/json']
    },
    compressPublicAssets: true
  },

  vite: {
    build: {
      minify: 'esbuild'
    }
  },

  devServer: {
    port: 3000
  }
})
