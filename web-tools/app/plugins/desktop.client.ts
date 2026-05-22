export default defineNuxtPlugin((nuxtApp) => {
  const { registerElectronBridge, syncWindowChrome } = useDesktop()
  registerElectronBridge()

  nuxtApp.hook('page:finish', () => {
    syncWindowChrome()
  })
})
