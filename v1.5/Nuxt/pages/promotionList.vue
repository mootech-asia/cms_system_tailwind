<template lang="pug">
Banner
main(class="min-h-[calc(100vh-333px)] xl:min-h-[calc(100vh-172px)] bg-[#060C34]")
  section(class="py-4 px-5 xl:px-[96px] xl:py-16 3xl:px-[160px]")
    h1(class="w-fit text-xl xl:text-[28px] text-gradient-primary font-bold pb-2") {{ $t('navbar.desktop.promotion') }}
    div(class="w-full border-b-gradient-primary hidden md:block mb-2 xl:mb-7")

    //- categories
    div(class="w-full flex overflow-x-auto overflow-y-visible no-scrollbar")
      div(v-for="(c, index) in categories" :key="index" class="px-4 py-2 whitespace-nowrap text-white border-b border-[#4F4F4F] cursor-pointer"
        :class="{ 'text-gradient-primary': index === activeCategory, 'border-b-gradient-primary': index === activeCategory }"
        @click="activeCategory = index"
      ) {{ c.title }}
      div(class="flex-1 border-b border-[#4F4F4F]")

    //- card
    template(v-if="promotions.length > 0")
      div(class="mt-4 xl:mt-7 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 xl:grid-cols-4 2xl:grid-cols-4")
        div(v-for="(p, i) in promotions" :key="i" class="rounded-[28px] overflow-hidden bg-transparent cursor-pointer group" @click="navigateTo(`/promotionDetail?id=${p.promotion_id}`)")
          div(class="rounded-t-[28px] h-[168px] overflow-hidden bg-transparent")
            NuxtImg(:src="p.i18n.mobile_banner_image_url" class="xl:hidden w-full h-full object-cover rounded-t-[28px] transform-gpu transition-[transform,height] duration-500 ease-out group-hover:scale-[1.15] group-hover:h-[204px] xl:group-hover:h-[202px]" :alt="p.title")
            NuxtImg(:src="p.i18n.desktop_banner_image_url" class="hidden xl:block w-full h-full object-cover rounded-t-[28px] transform-gpu transition-[transform,height] duration-500 ease-out group-hover:scale-[1.15] group-hover:h-[204px] xl:group-hover:h-[202px]" :alt="p.title")
          p(v-if="p.end_date !== 0" class="text-sm font-semibold text-center text-black bg-gradient-primary py-1") {{ dayjs.unix(p.start_date).format('YYYY.MM.DD') }} - {{ dayjs.unix(p.end_date).format('YYYY.MM.DD') }}
          p(v-else class="text-sm font-semibold text-center text-black bg-gradient-primary py-1") ♾️
          div(class="bg-[#E7E7E7] rounded-b-[28px] flex items-center p-4 xl:px-3.5 xl:py-3")
            h3(class="text-black text-xs font-semibold") {{ p.title }}
            //- div(class="w-full text-[#6D6D6D] text-sm text-left hidden xl:block mt-2" v-html="p.i18n.desktop_content")

    //- intersection sentinel
    div(ref="sentinel" class="h-2 w-full")
  
</template>
<script setup>
import { api } from '~/composables/useApi'
import dayjs from 'dayjs'
import { usePlatformData } from '~/composables/usePlatformData'

const router = useRouter()
const { locale } = useI18n()
const { initPlatformData } = usePlatformData()

const categories = ref([])
const activeCategory = ref(0)
const promotions = ref([])
const promotionTypes = ref([])
const page = ref(1)
const pageSize = ref(4)
const total = ref(0)
const sentinel = ref(null)
const loading = ref(false)

const totalPages = computed(() => {
  if (!total.value || !pageSize.value) return 0
  return Math.ceil(total.value / pageSize.value)
})

let observer
const isLocaleRefreshing = ref(false)

onMounted(async () => {
  await initPlatformData({
    announcements: true,
  })
  await getPromotionTypes()
  await getPromotions()
  initObserver()
})

watch(activeCategory, async () => {
  page.value = 1
  total.value = 0
  promotions.value = []
  await getPromotions()

  // 重新掛載 observer
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value)
    observer.observe(sentinel.value)
  }

  // 如果新的分類有超過一頁，且 sentinel 目前就在畫面中，主動預先載入下一頁
  if (
    typeof window !== 'undefined' &&
    totalPages.value > 1 &&
    sentinel.value &&
    sentinel.value.getBoundingClientRect
  ) {
    const rect = sentinel.value.getBoundingClientRect()
    const inView = rect.top < window.innerHeight && rect.bottom >= 0
    if (inView && page.value < totalPages.value) {
      page.value += 1
      await getPromotions()
    }
  }
})

watch(locale, async () => {
  isLocaleRefreshing.value = true

  page.value = 1
  total.value = 0
  promotions.value = []

  await getPromotionTypes()
  await getPromotions()

  // 重新掛載 observer
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value)
    observer.observe(sentinel.value)
  }

  isLocaleRefreshing.value = false
})

async function getPromotionTypes() {
  const response = await api.getPromotionTypes()
  categories.value = response.data
  activeCategory.value = response.data.length > 0 ? 0 : -1
}

async function getPromotions() {
  if (totalPages.value && page.value > totalPages.value) return
  const response = await api.getPromotionList({
    page: page.value,
    page_size: pageSize.value,
    banner_type_id:
      activeCategory.value >= 0 && categories.value[activeCategory.value]?.banner_type_id,
  })

  total.value = response.data.total

  if (page.value === 1) {
    promotions.value = response.data.promotions || []
  } else {
    promotions.value = [...promotions.value, ...(response.data.promotions || [])]
  }
}

function initObserver() {
  if (observer || typeof window === 'undefined' || !('IntersectionObserver' in window)) return

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (!entry?.isIntersecting) return

    // totalPages === 0 代表沒有任何資料，直接不載入下一頁
    if (!totalPages.value) return

    // 只要目前頁數還小於總頁數，就載入下一頁
    if (page.value < totalPages.value) {
      page.value += 1
      getPromotions()
    } else if (observer && sentinel.value) {
      // 已經到最後一頁，停止觀察
      observer.unobserve(sentinel.value)
    }
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  } else {
    const stop = watch(
      sentinel,
      (el) => {
        if (el && observer) {
          observer.observe(el)
          stop()
        }
      },
      { immediate: true },
    )
  }
}

onBeforeUnmount(() => {
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value)
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
