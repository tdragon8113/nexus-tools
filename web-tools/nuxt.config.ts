import { desktopDevtoolsGuard } from './vite/desktop-devtools-guard'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NUXT_DISABLE_DEVTOOLS !== '1' },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@vant/nuxt'
  ],

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      'Noto Sans SC': [400, 500, 600, 700],
      'Noto Serif SC': [400, 600, 700],
      'JetBrains Mono': [400, 500, 600]
    },
    display: 'swap'
  },

  css: ['~~/assets/css/main.css', '~~/assets/css/desktop-theme.css'],

  vant: {
    lazyload: true
  },

  routeRules: {
    '/': { redirect: '/desktop/search' },
    '/tools': { redirect: '/desktop/search' },
    '/desktop/hub': { redirect: '/desktop/search' }
  },

  app: {
    head: {
      title: 'Nexus Tools',
      meta: [
        { name: 'description', content: 'Nexus Tools 桌面开发者工具箱' },
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
      routes: [
        '/desktop/search',
        '/desktop/settings',
        '/tools/totp',
        '/tools/json',
        '/tools/base64',
        '/tools/calculator',
        '/tools/ip',
        '/tools/geo'
      ]
    },
    compressPublicAssets: true
  },

  vite: {
    plugins: [desktopDevtoolsGuard()],
    build: {
      minify: 'esbuild'
    },
    // 开发时预打包，避免首次打开 /tools/json 时 Vite 运行时发现并整页重载
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'codemirror',
        '@codemirror/lang-json',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/autocomplete',
        '@codemirror/search',
        'jsonc-parser',
        'qrcode',
        'jsqr'
      ]
    }
  },

  devServer: {
    port: 3000
  }
})
