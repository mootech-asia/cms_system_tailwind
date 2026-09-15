import { effectScope, watch } from 'vue'
import { normalizeLanguage } from '~/composables/useLanguage'

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n

  if (process.client && i18n) {
    const cookie = useCookie('language')
    const saved = import.meta.dev ? 'en' : (cookie.value || localStorage.getItem('language'))
    const TRACE_TIMEOUT_MS = 3000

    function getDeviceLanguage () {
      const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
      const isKorean = languages.some((lang) => String(lang || '').toLowerCase().startsWith('ko'))
      return isKorean ? 'ko' : 'en'
    }

    function getTraceLanguage (text) {
      const locMatch = String(text).match(/(?:^|\n)loc=([^\n\r]+)/)
      const locCode = locMatch ? String(locMatch[1]).trim() : ''
      if (!locCode) throw new Error('Trace response missing loc')
      return locCode.toUpperCase() === 'KR' ? 'ko' : 'en'
    }

    async function fetchTraceWithTimeout () {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), TRACE_TIMEOUT_MS)

      try {
        const res = await fetch('/cdn-cgi/trace', {
          method: 'GET',
          signal: controller.signal
        })
        if (!res.ok) throw new Error(`Unexpected trace response: ${res.status}`)
        return await res.text()
      } finally {
        window.clearTimeout(timer)
      }
    }

    async function applyLanguage (next) {
      const lang = normalizeLanguage(next)
      try {
        if (typeof i18n.setLocale === 'function') await i18n.setLocale(lang)
        else i18n.locale.value = lang
      } catch {
        i18n.locale.value = lang
      }

      cookie.value = lang
      localStorage.setItem('language', lang)
    }

    async function logCloudflareTrace () {
      try {
        if (import.meta.dev) {
          await applyLanguage('en')
          return
        }

        if (typeof fetch === 'undefined') return
        const text = await fetchTraceWithTimeout()
        await applyLanguage(getTraceLanguage(text))
      } catch (e) {
        console.log('[cdn-cgi/trace] fetch failed', e)
        await applyLanguage(getDeviceLanguage())
      }
    }

    if (saved) {
      void applyLanguage(saved)
    } else {
      void logCloudflareTrace()
    }

    const scope = effectScope()
    scope.run(() => {
      watch(
        () => i18n.locale.value,
        (v) => {
          try {
            const lang = normalizeLanguage(v)
            const c = useCookie('language')
            c.value = lang
            localStorage.setItem('language', lang)
          } catch {}
        },
        { immediate: false }
      )
    })
  }
})
