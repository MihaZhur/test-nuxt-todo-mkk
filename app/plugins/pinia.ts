import { createPinia } from 'pinia'

export default defineNuxtPlugin({
  name: 'pinia',
  enforce: 'pre',
  setup(nuxtApp) {
    const pinia = createPinia()
    nuxtApp.vueApp.use(pinia)
    return { provide: { pinia } }
  }
})
