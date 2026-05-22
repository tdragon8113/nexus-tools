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
      routes: [
        '/desktop/search',
        '/desktop/hub',
        '/tools',
        '/tools/json',
        '/tools/base64',
        '/tools/timestamp',
        '/tools/url',
        '/tools/uuid',
        '/tools/password',
        '/tools/calculator',
        '/tools/qrcode',
        '/tools/color',
        '/tools/regex',
        '/tools/http',
        '/tools/hash',
        '/tools/code',
        '/tools/text-diff'
      ]
    },
    compressPublicAssets: true
  },

  vite: {
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
        '@codemirror/lang-javascript',
        '@codemirror/lang-html',
        '@codemirror/lang-css',
        '@codemirror/lang-python',
        '@codemirror/lang-sql',
        '@codemirror/lang-markdown',
        '@codemirror/lang-xml',
        '@codemirror/lang-yaml',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/autocomplete',
        '@codemirror/search',
        'jsonc-parser',
        'diff',
        'qrcode',
        'jsqr',
        'spark-md5',
        'prettier',
        'prettier/standalone'
      ]
    }
  },

  devServer: {
    port: 3000
  }
})
