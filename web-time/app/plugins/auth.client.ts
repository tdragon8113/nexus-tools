export default defineNuxtPlugin(() => {
  useAuthSession().sync()
})
