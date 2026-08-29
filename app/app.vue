<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'ru' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#f4f6f2' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
    }
  ]
})
</script>

<template>
  <NuxtPage />
</template>
