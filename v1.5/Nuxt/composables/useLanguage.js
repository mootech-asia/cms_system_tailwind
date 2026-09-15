export const DEFAULT_LANGUAGE = 'ko'

export const SUPPORTED_LANGUAGES = ['en', 'ko']

export function normalizeLanguage (lang) {
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE
}

export function getCurrentLanguage () {
  const nuxtApp = useNuxtApp()
  const locale = nuxtApp.$i18n?.locale?.value

  if (locale) return normalizeLanguage(locale)

  if (process.client) {
    const cookie = useCookie('language')
    return normalizeLanguage(cookie.value || localStorage.getItem('language'))
  }

  return DEFAULT_LANGUAGE
}
