<template lang="pug">
section
  .banner(class="relative bg-[#060C34] mt-10")      
    .slides(ref="slidesWrap" class="h-[360px] md:h-[260px] xl:h-[433px] 3xl:h-[650px]")
      .slide(
        v-for="(s, i) in slides" :key="i"
        class="absolute inset-0 transition-opacity duration-500"
        :class="{ 'opacity-100 pointer-events-auto is-active': i === active, 'opacity-0 pointer-events-none': i !== active }"
      )
        NuxtImg(class="w-full h-[360px] object-cover md:hidden" :src="s.image_url" alt="Banner mobile")
        NuxtImg(class="w-full h-[260px] object-cover hidden md:block xl:hidden" :src="s.image_url" alt="Banner ipad")
        NuxtImg(class="w-full h-[433px] object-cover hidden xl:block 3xl:hidden" :src="s.image_url" alt="Banner pc 1280")
        NuxtImg(class="w-full h-[650px] object-cover hidden 3xl:block" :src="s.image_url" alt="Banner pc 1920")

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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useGlobalUiStore } from '~/stores/globalUi'

const globalUiStore = useGlobalUiStore()

const slides = ref([])
const active = ref(0)
const autoplayMs = 6000
let autoplayTimer = null
const bannerHeight = ref(427)
const slidesWrap = ref(null)
let ro = null

function syncBannerList() {
  if (typeof window === 'undefined') return
  const items = globalUiStore.announcements?.banner_items || []
  if (!items.length) {
    slides.value = []
    active.value = 0
    return
  }

  const isDesktop = window.innerWidth > 1280
  const groupName = isDesktop ? 'home_promotion_banner' : 'home_promotion_banner_m'

  const matched = items.find((item) => item.meta_json?.config?.banner_group_name === groupName)

  slides.value = matched?.meta_json?.config?.banner_configs || []
  if (active.value > slides.value.length - 1) active.value = 0
  nextTick().then(observeCurrent)
}

function getCurrentImgEl() {
  const root = slidesWrap.value
  if (!root) return null
  const activeSlide = root.querySelector('.slide.is-active')
  if (!activeSlide) return null
  const imgs = activeSlide.querySelectorAll('img')
  for (const img of imgs) {
    const style = window.getComputedStyle(img)
    if (style.display !== 'none' && style.visibility !== 'hidden' && img.offsetParent !== null) {
      return img
    }
  }
  return imgs[0] || null
}

function updateHeightFrom(el) {
  if (!el) return
  bannerHeight.value = el.getBoundingClientRect().height
}

function observeCurrent() {
  const img = getCurrentImgEl()
  if (!img) return
  ro?.disconnect()
  ro = new ResizeObserver(() => updateHeightFrom(img))
  ro.observe(img)
  if (!(img.complete && img.naturalHeight)) {
    img.addEventListener('load', () => updateHeightFrom(img), { once: true })
  }
  updateHeightFrom(img)
}

function next() {
  if (!slides.value.length) return
  active.value = (active.value + 1) % slides.value.length
  nextTick().then(observeCurrent)
}

function prev() {
  if (!slides.value.length) return
  active.value = (active.value - 1 + slides.value.length) % slides.value.length
  nextTick().then(observeCurrent)
}

function go(i) {
  if (i === active.value) return
  active.value = i
  nextTick().then(() => {
    observeCurrent()
    startAutoplay()
  })
}

function startAutoplay() {
  stopAutoplay()
  if (slides.value.length <= 1) return
  autoplayTimer = setInterval(next, autoplayMs)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function handleResize() {
  observeCurrent()
  syncBannerList()
}

onMounted(async () => {
  await nextTick()
  observeCurrent()
  startAutoplay()
  syncBannerList()
  window.addEventListener('resize', handleResize)
})

watch(
  () => globalUiStore.announcements,
  () => {
    syncBannerList()
    startAutoplay()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  ro?.disconnect()
  stopAutoplay()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
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
