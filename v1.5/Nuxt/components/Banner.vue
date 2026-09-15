<template lang="pug">
section
  div(class="banner relative bg-[#060C34] mt-[64px] xl:mt-[132px]")
    div(ref="slidesWrap" class="slides relative w-full" :style="slidesStyle")
      transition(name="fade")
        div(v-if="currentSlide" :key="slideKey" class="slide w-full border-t-gradient-primary")
          template(v-if="isVideo")
            video(class="w-full block" :src="currentSrc" autoplay muted :loop="slides.length <= 1" playsinline preload="auto" @loadedmetadata="onMediaReady" @ended="onVideoEnded" @error="onVideoError")
          template(v-else)
            NuxtImg(class="w-full block" :src="currentSrc" loading="eager" fetchpriority="high" @load="onMediaReady")

    .pagination(v-show="slides.length > 1" class="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 flex items-center gap-3")
      button(
        v-for="(s, i) in slides" :key="'dot-' + i"
        type="button"
        :aria-label="`Go to slide ${i + 1}`"
        @click="go(i)"
        class="dot"
        :class="{ 'dot--active': i === active }"
      )
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import { useGlobalUiStore } from '~/stores/globalUi'

const globalUiStore = useGlobalUiStore()
const props = defineProps({
  bannerConfigs: { type: Array, default: null },
})

const slidesWrap = ref(null)
const slides = ref([])
const active = ref(0)
const currentSlide = computed(() => slides.value?.[active.value] || null)
const currentSrc = computed(() => currentSlide.value?.image_url || '')
const isVideo = computed(() => String(currentSrc.value).includes('.mp4'))
const slideKey = computed(() => currentSrc.value || `slide-${active.value}`)
const heightPx = ref(200)
const currentRatio = ref(null)
const slidesStyle = computed(() => {
  return heightPx.value > 0 ? { height: `${heightPx.value}px` } : undefined
})
const autoplayMs = 6000
let autoplayTimer = null
const bannerPreloadLinks = computed(() =>
  slides.value.map((slide, index) => {
    const href = slide?.image_url
    if (!href) return null

    const isVideo = isSlideVideo(slide)
    return {
      key: `banner-preload-${index}-${href}`,
      rel: 'preload',
      href,
      as: isVideo ? 'video' : 'image',
      ...(isVideo ? { type: 'video/mp4' } : {}),
    }
  })
  .filter(Boolean),
)

useHead(() => ({
  link: bannerPreloadLinks.value,
}))

function measureCurrentHeight() {
  if (typeof window === 'undefined') return 0
  const el = slidesWrap.value
  if (!el) return 0
  const slideEl = el.querySelector('.slide')
  const rect = slideEl ? slideEl.getBoundingClientRect() : el.getBoundingClientRect()
  const h = rect.height
  return Number.isFinite(h) ? Math.ceil(h) : 0
}

function isSlideVideo(slide) {
  return String(slide?.image_url || '').includes('.mp4')
}

function applyHeightFromRatio(ratio) {
  if (!ratio) return
  if (typeof window === 'undefined') return
  const el = slidesWrap.value
  if (!el) return
  const w = el.getBoundingClientRect().width
  if (!w) return
  heightPx.value = Math.max(1, Math.round(w * ratio))
}

function onMediaReady(e) {
  const target = e?.target
  let ratio = null

  if (target?.tagName === 'IMG') {
    const nw = Number(target.naturalWidth) || 0
    const nh = Number(target.naturalHeight) || 0
    if (nw > 0 && nh > 0) ratio = nh / nw
  } else if (target?.tagName === 'VIDEO') {
    const vw = Number(target.videoWidth) || 0
    const vh = Number(target.videoHeight) || 0
    if (vw > 0 && vh > 0) ratio = vh / vw
  }

  if (ratio) {
    currentRatio.value = ratio
    applyHeightFromRatio(ratio)
    // Images advance via timer, start it once we have the size; videos rely on @ended, no timer needed.
    if (target?.tagName !== 'VIDEO') startAutoplay()
    return
  }

  const h = measureCurrentHeight()
  if (h) heightPx.value = h
  startAutoplay()
}

function normalizeActive() {
  const len = slides.value.length
  if (!len) {
    active.value = 0
    return
  }
  const n = Number(active.value)
  if (!Number.isFinite(n)) {
    active.value = 0
    return
  }
  active.value = ((Math.trunc(n) % len) + len) % len
}

function next() {
  const len = slides.value.length
  if (!len) {
    active.value = 0
    return
  }
  const currentH = measureCurrentHeight()
  if (currentH) heightPx.value = currentH
  normalizeActive()
  active.value = (active.value + 1) % len
  startAutoplay()
}

function prev() {
  const len = slides.value.length
  if (!len) {
    active.value = 0
    return
  }
  const currentH = measureCurrentHeight()
  if (currentH) heightPx.value = currentH
  normalizeActive()
  active.value = (active.value - 1 + len) % len
  startAutoplay()
}

function go(i) {
  if (i === active.value) return
  const currentH = measureCurrentHeight()
  if (currentH) heightPx.value = currentH
  active.value = i
  nextTick().then(() => {
    startAutoplay()
  })
}

function startAutoplay() {
  stopAutoplay()
  if (slides.value.length <= 1) return

  // Videos advance solely via @ended (and @error on load failure) with no timer, which
  // fundamentally prevents the timer and ended from each calling next() at the same moment
  // a video finishes and skipping a slide. Only images use a fixed autoplay interval.
  if (isVideo.value) return

  autoplayTimer = setTimeout(() => {
    next()
  }, autoplayMs)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

function onVideoEnded(e) {
  if (slides.value.length <= 1) return
  // Ignore a late ended from a stale video (fast switching / transition not finished) to avoid a wrong skip.
  if (e?.target?.currentSrc && !String(e.target.currentSrc).includes(currentSrc.value)) return

  stopAutoplay()
  next()
}

// A failed video never fires ended; @error advances instead so the banner doesn't get stuck on a broken video.
function onVideoError(e) {
  if (slides.value.length <= 1) return
  if (e?.target?.currentSrc && !String(e.target.currentSrc).includes(currentSrc.value)) return

  stopAutoplay()
  next()
}

function syncBannerList() {
  if (typeof window === 'undefined') return
  if (Array.isArray(props.bannerConfigs)) {
    slides.value = props.bannerConfigs
    normalizeActive()
    return
  }
  const items = globalUiStore.announcements?.banner_items || []
  if (!items.length) {
    slides.value = []
    return
  }

  const isDesktop = window.innerWidth > 1280
  const groupName = isDesktop ? 'home_banner' : 'home_banner_m'

  const matched = items.find((item) => item.meta_json?.config?.banner_group_name === groupName)

  slides.value = matched?.meta_json?.config?.banner_configs || []
  normalizeActive()
}

function handleResize() {
  syncBannerList()
  nextTick().then(() => {
    applyHeightFromRatio(currentRatio.value)
  })
}

onMounted(async () => {
  await nextTick()
  syncBannerList()
  startAutoplay()
  heightPx.value = measureCurrentHeight() || heightPx.value
  window.addEventListener('resize', handleResize)
})

watch(
  () => globalUiStore.announcements,
  () => {
    syncBannerList()
  },
  { immediate: true },
)

watch(
  () => props.bannerConfigs,
  () => {
    syncBannerList()
  },
  { immediate: true },
)

watch(
  () => slides.value.length,
  () => {
    normalizeActive()
    startAutoplay()
    nextTick().then(() => {
      const h = measureCurrentHeight()
      if (h) heightPx.value = h
    })
  },
)

onBeforeUnmount(() => {
  stopAutoplay()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.slides {
  overflow: hidden;
  transition: height 500ms ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 500ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-active {
  position: absolute;
  inset: 0;
  width: 100%;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}

.dot:hover {
  transform: scale(1.05);
}

.dot--active {
  width: 24px;
  height: 24px;
  background: transparent;
  border: 3px solid rgba(255, 255, 255, 0.95);
}
</style>
