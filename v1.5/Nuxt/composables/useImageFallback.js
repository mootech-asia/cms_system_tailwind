import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export function useImageFallback (options = {}) {
  const mobileBreakpoint = options.mobileBreakpoint ?? 768
  const defaultFallbackSrcMobile =
    options.fallbackSrcMobile || '/images/common/img-comingsoon-mobile.png'
  const defaultFallbackSrcWeb = options.fallbackSrcWeb || '/images/common/img-comingsoon-web.png'

  const fallbackByType = options.fallbackByType || {
    hotgame: {
      mobile: '/images/common/img-comingsoon-game.png',
      web: '/images/common/img-comingsoon-game.png'
    },
    game: {
      mobile: '/images/common/img-comingsoon-mobile.png',
      web: '/images/common/img-comingsoon-web.png'
    }
  }

  const isMobile = ref(false)

  function syncIsMobile () {
    if (typeof window === 'undefined') return
    isMobile.value = window.innerWidth < mobileBreakpoint
  }

  onMounted(() => {
    syncIsMobile()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncIsMobile)
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', syncIsMobile)
    }
  })

  function getFallbackSrc (type) {
    if (options.fallbackSrc) return options.fallbackSrc
    const t = type || 'default'
    const cfg = fallbackByType[t]
    if (cfg && typeof cfg === 'object') {
      return isMobile.value
        ? cfg.mobile || defaultFallbackSrcMobile
        : cfg.web || defaultFallbackSrcWeb
    }
    return isMobile.value ? defaultFallbackSrcMobile : defaultFallbackSrcWeb
  }

  const fallbackSrc = computed(() => getFallbackSrc())
  const brokenByKey = ref({})

  function normalizeBrokenKey (key, type) {
    if (type) return `${type}:${key}`
    return String(key)
  }

  function onError (key, type) {
    if (key === undefined || key === null) return
    const brokenKey = normalizeBrokenKey(key, type)
    if (brokenByKey.value[brokenKey]) return

    brokenByKey.value = {
      ...brokenByKey.value,
      [brokenKey]: true
    }
  }

  function getSrc (key, src, type) {
    if (key !== undefined && key !== null) {
      const brokenKey = normalizeBrokenKey(key, type)
      if (brokenByKey.value[brokenKey]) {
        return getFallbackSrc(type)
      }
    }
    return src || getFallbackSrc(type)
  }

  function reset (key, type) {
    if (key === undefined || key === null) {
      brokenByKey.value = {}
      return
    }

    const brokenKey = normalizeBrokenKey(key, type)
    if (!brokenByKey.value[brokenKey]) return
    const next = { ...brokenByKey.value }
    delete next[brokenKey]
    brokenByKey.value = next
  }

  return {
    fallbackSrc,
    brokenByKey,
    onError,
    getSrc,
    reset
  }
}
