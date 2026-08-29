// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/shared/ui', pathPrefix: false }
  ],
  typescript: {
    strict: true,
    typeCheck: true
  },
  css: [
    '~/shared/styles/main.scss'
  ]
})
