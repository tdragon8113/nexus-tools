import type { Plugin } from 'vite'

/** Nexus Tools 仅桌面壳：不嵌入 Nuxt DevTools 底栏 */
const SCRIPT = `(function(){try{window.__NUXT_DEVTOOLS_DISABLE__=true}catch(e){}})();`

export function desktopDevtoolsGuard(): Plugin {
  return {
    name: 'nexus-desktop-devtools-guard',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (html.includes('__NUXT_DEVTOOLS_DISABLE__')) return html
        const tag = `<script>${SCRIPT}</script>`
        return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${tag}`)
      }
    }
  }
}
