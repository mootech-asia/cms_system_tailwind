// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Win10096',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap',
        },
      ],
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@pinia/nuxt',
    [
      '@nuxtjs/i18n',
      {
        strategy: 'no_prefix',
        defaultLocale: 'ko',
        locales: [
          { code: 'en', name: 'English', file: 'en.json' },
          { code: 'ko', name: '한국어', file: 'ko.json' },
        ],
        lazy: true,
        langDir: '../locales',
        detectBrowserLanguage: false,
        vueI18n: './i18n.config.ts',
      },
    ],
  ],
  css: ['@/assets/styles/tailwind.css', 'primeicons/primeicons.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      tenantId: process.env.NUXT_PUBLIC_TENANT_ID,
      brandId: process.env.NUXT_PUBLIC_BRAND_ID,
      forwardedHost: process.env.NUXT_PUBLIC_FORWARDED_HOST,
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
    },
  },
  build: {
    transpile: ['primevue'],
  },
  nitro: {
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
      '/images/**': {
        headers: {
          'cache-control': 'no-cache, must-revalidate',
        },
      },
      '/**': {
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate',
        },
      },
      // '/api/**': { proxy: `${process.env.NUXT_PUBLIC_API_BASE}/**` },
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://192.168.100.34',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
