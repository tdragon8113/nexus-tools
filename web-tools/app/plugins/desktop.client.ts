import { hydrateDesktopLocalStateFromMain } from '~/core/desktopLocalState'
import { hydrateTotpAccountsFromMain } from '~/core/totpAccountsState'

const DEVTOOLS_NODES =
  '#nuxt-devtools-container,#nuxt-devtools-anchor,#nuxt-devtools-iframe,nuxt-devtools-frame,.nuxt-devtools-frame'

function purgeNuxtDevtools() {
  window.__NUXT_DEVTOOLS_DISABLE__ = true
  document.querySelectorAll(DEVTOOLS_NODES).forEach((el) => el.remove())
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const { registerElectronBridge, syncWindowChrome, syncPinnedFromMain } = useDesktop()
  const { syncFromMain: syncThemeFromMain, bindSystemThemeListener } = useDesktopTheme()
  registerElectronBridge()

  let unbindSystemTheme = () => {}

  if (import.meta.client) {
    document.documentElement.dataset.nexusDesktop = '1'
    await hydrateDesktopLocalStateFromMain()
    await hydrateTotpAccountsFromMain()
    await syncThemeFromMain()
    unbindSystemTheme = bindSystemThemeListener()
    purgeNuxtDevtools()
    const observer = new MutationObserver(purgeNuxtDevtools)
    observer.observe(document.documentElement, { childList: true, subtree: true })
    nuxtApp.hook('page:finish', purgeNuxtDevtools)
    nuxtApp.hook('app:suspense:resolve', purgeNuxtDevtools)
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        observer.disconnect()
        unbindSystemTheme()
      })
    }
  }

  nuxtApp.hook('page:finish', () => {
    setPageLayout('desktop')
    void syncWindowChrome()
    void syncPinnedFromMain()
  })
})
