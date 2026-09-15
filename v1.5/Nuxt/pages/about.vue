<template lang="pug">
main(class="min-h-[calc(100vh-171px)] bg-[#060C34] pt-16 xl:pt-[123px]")
  section(class="w-full xl:w-[960px] mx-auto py-4 xl:py-16")
    //- Title
    div(class="border-b-gradient-primary mx-5 xl:mx-0")
      h1(class="w-fit text-[#fff] text-xl xl:text-[28px] font-bold text-gradient-primary pb-2") {{ $t('about.title') }}
    
    //- Tabs
    div(class="mt-2 xl:mt-7")
      div(class="w-[calc(100%-20px)] xl:w-full overflow-auto ml-5 mr-5 xl:ml-0 no-scrollbar border-b border-[#4F4F4F]")
        div(class="flex items-center")
          button(v-for="tab in tabs" :key="tab" class="flex items-center text-white px-4 py-2 whitespace-nowrap shrink-0"
            :class="{'border-b-gradient-primary text-gradient-primary': tabActive === tab}"
            @click="tabActive = tab")
            | {{ $t('about.tabs.' + tab) }}
            NuxtImg(v-show="tab === 'exclusionList'" :src="tabActive === 'exclusionList' ? '/images/icon/about-active.svg' : '/images/icon/about.svg'" class="w-4 h-4 ml-2")
    
    //- Search
    div(v-if="tabActive === 'exclusionList'" class="flex items-center justify-end gap-4 mt-7 px-5 xl:px-0")
      //- Select
      div(class="relative w-[240px]")
        select(v-model="typeValue" class="w-full h-10 appearance-none bg-transparent text-sm x:text-base text-white placeholder-white/60 px-4 py-2 rounded-[10px] border border-white/30 focus:border-white/60 outline-none pr-10 cursor-pointer")
          option(v-for="opt in typeOptions" :key="opt.value" :value="opt.value") {{ $t(opt.labelKey) }}
        svg(class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true")
          path(fill-rule="evenodd" clip-rule="evenodd" d="M10 12a1 1 0 0 1-.707-.293l-4-4a1 1 0 1 1 1.414-1.414L10 9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4A1 1 0 0 1 10 12z")
      
      //- Input
      div(class="relative w-[300px]")
        svg(class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true")
          path(fill-rule="evenodd" clip-rule="evenodd" d="M12.9 14.32a8 8 0 1 1 1.414-1.414l3.39 3.39a1 1 0 0 1-1.414 1.414l-3.39-3.39ZM14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z")
        input(type="text" v-model="keyword" :placeholder="$t('common.gameName')" class="w-full h-10 bg-[#1F1F1F] text-sm text-white placeholder-white/60 px-9 py-3 rounded-[10px] border border-white/30 focus:border-white/60 outline-none")

    //- Content
    template(v-if="tabActive === 'faq'")
      div(v-for="(item, i) in dataFAQ" :key="i" class="px-5")
        p(class="w-fit text-gradient-primary font-bold xl:text-xl my-4 xl:my-7") {{ $t(item.titleKey) }}
        div(v-for="(content, c) in item.content" :key="c" class="bg-[#1D2647] rounded-lg border border-[#4F4F4F] mb-4 last:mb-0")
          div(class="flex items-center justify-between px-4 py-2 cursor-pointer select-none" @click="toggleFaq(`${i}-${c}`)")
            p(class="xl:text-xl text-white font-bold") {{ $t(content.titleKey) }}
            svg(class="w-4 h-4 text-white/80 transition-transform duration-300" :class="{ 'rotate-180': isOpen(`${i}-${c}`) }" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true")
              path(fill-rule="evenodd" clip-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.117l3.71-2.886a.75.75 0 1 1 .92 1.19l-4.2 3.27a.75.75 0 0 1-.92 0l-4.2-3.27a.75.75 0 0 1-.09-1.11Z")
          div(class="rich text-[#E7E7E7] px-4 overflow-hidden transition-all duration-300 whitespace-pre-line"
            :class="isOpen(`${i}-${c}`) ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0'") {{ $t(content.detailKey) }}

    template(v-else)
      div(class="mt-4 xl:mt-7 px-5 xl:px-0")
        div(v-for="(item, i) in data" :key="i" class="bg-[#1D2647] border border-[#4F4F4F] rounded-lg mb-7")
          p(class="xl:text-xl font-bold px-4 py-2" :class="{'border-b border-[#4F4F4F]': item.detailKey}")
            span(class="w-fit text-gradient-primary") {{ $t(item.titleKey) }}
          div(v-if="item.detailKey" class="rich text-sm text-[#E7E7E7] px-4 py-2 whitespace-pre-line") {{ $t(item.detailKey) }}

</template>
<script setup>
const route = useRoute()
const { t } = useI18n()

const tabLabelToKey = computed(() => {
  const m = {}
  ;[
    'support',
    'notice',
    'about',
    'privacy',
    'info',
    'addiction',
    'rules',
    'exclusionList',
    'faq',
  ].forEach((k) => {
    m[t('about.tabs.' + k)] = k
  })
  return m
})

const legacyEnToKey = {
  Support: 'support',
  Notice: 'notice',
  About: 'about',
  Privacy: 'privacy',
  Info: 'info',
  Addiction: 'addiction',
  Rules: 'rules',
  'Exclusion turnover list': 'exclusionList',
  FAQ: 'faq',
}

const initialTab =
  typeof route.query.tab === 'string'
    ? tabLabelToKey.value[route.query.tab] || legacyEnToKey[route.query.tab] || route.query.tab
    : 'support'
const tabActive = ref(initialTab)

watch([() => route.query.tab, tabLabelToKey], () => {
  if (typeof route.query.tab === 'string') {
    tabActive.value =
      tabLabelToKey.value[route.query.tab] || legacyEnToKey[route.query.tab] || route.query.tab
  }
})

const datas = ref([
  { key: 'support', content: [{ titleKey: 'about.support.items.0.title' }] },
  {
    key: 'notice',
    content: [
      { titleKey: 'about.notice.items.0.title', detailKey: 'about.notice.items.0.detail' },
      { titleKey: 'about.notice.items.1.title', detailKey: 'about.notice.items.1.detail' },
    ],
  },
  {
    key: 'about',
    content: [{ titleKey: 'about.about.items.0.title', detailKey: 'about.about.items.0.detail' }],
  },
  {
    key: 'privacy',
    content: [
      { titleKey: 'about.privacy.items.0.title', detailKey: 'about.privacy.items.0.detail' },
      { titleKey: 'about.privacy.items.1.title', detailKey: 'about.privacy.items.1.detail' },
    ],
  },
  {
    key: 'info',
    content: [{ titleKey: 'about.info.items.0.title', detailKey: 'about.info.items.0.detail' }],
  },
  {
    key: 'addiction',
    content: [
      { titleKey: 'about.addiction.items.0.title', detailKey: 'about.addiction.items.0.detail' },
      { titleKey: 'about.addiction.items.1.title', detailKey: 'about.addiction.items.1.detail' },
      { titleKey: 'about.addiction.items.2.title', detailKey: 'about.addiction.items.2.detail' },
    ],
  },
  {
    key: 'rules',
    content: [
      { titleKey: 'about.rules.items.0.title', detailKey: 'about.rules.items.0.detail' },
      { titleKey: 'about.rules.items.1.title', detailKey: 'about.rules.items.1.detail' },
    ],
  },
  // {
  //   key: 'exclusionList',
  //   content: [
  //     { titleKey: 'about.exclusion.items.0.title', detailKey: 'about.exclusion.items.0.detail' },
  //     { titleKey: 'about.exclusion.items.1.title', detailKey: 'about.exclusion.items.1.detail' },
  //     { titleKey: 'about.exclusion.items.2.title', detailKey: 'about.exclusion.items.2.detail' },
  //   ],
  // },
  {
    key: 'faq',
    category: [
      {
        titleKey: 'about.faq.categories.0.title',
        content: [
          {
            titleKey: 'about.faq.categories.0.items.0.title',
            detailKey: 'about.faq.categories.0.items.0.detail',
          },
          {
            titleKey: 'about.faq.categories.0.items.1.title',
            detailKey: 'about.faq.categories.0.items.1.detail',
          },
          {
            titleKey: 'about.faq.categories.0.items.2.title',
            detailKey: 'about.faq.categories.0.items.2.detail',
          },
        ],
      },
      {
        titleKey: 'about.faq.categories.1.title',
        content: [
          {
            titleKey: 'about.faq.categories.1.items.0.title',
            detailKey: 'about.faq.categories.1.items.0.detail',
          },
          {
            titleKey: 'about.faq.categories.1.items.1.title',
            detailKey: 'about.faq.categories.1.items.1.detail',
          },
        ],
      },
    ],
  },
])

const data = computed(() => {
  return datas.value.find((item) => item.key === tabActive.value)?.content || []
})

const dataFAQ = computed(() => {
  return datas.value.find((item) => item.key === 'faq')?.category || []
})

const tabs = [
  'support',
  'notice',
  'about',
  'privacy',
  'info',
  'addiction',
  'rules',
  // 'exclusionList',
  'faq',
]

const typeValue = ref('')
const keyword = ref('')
const typeOptions = [
  { labelKey: 'about.filters.all', value: '' },
  { labelKey: 'about.filters.slot', value: 'Slot' },
  { labelKey: 'about.filters.live', value: 'Live' },
]

const filteredData = computed(() => {
  const list = data.value
  const kw = keyword.value.trim().toLowerCase()
  const tv = typeValue.value
  return list.filter((item) => {
    const t = (item.titleKey ? tFn(item.titleKey) : '').toLowerCase()
    const d = (item.detailKey ? tFn(item.detailKey) : '').toLowerCase()
    const matchKw = kw ? t.includes(kw) || d.includes(kw) : true
    const matchType = tv ? d.includes(`game type: ${tv.toLowerCase()}`) : true
    return matchKw && matchType
  })
})

const openFaq = ref({})
const isOpen = (key) => !!openFaq.value[key]
const toggleFaq = (key) => {
  openFaq.value[key] = !openFaq.value[key]
}

function tFn(key) {
  try {
    return t(key)
  } catch {
    return ''
  }
}
</script>
<style scoped>
:deep(.rich ul) {
  list-style: disc;
  padding-left: 1.25rem;
}
:deep(.rich ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}
:deep(.rich li) {
  margin: 0.25rem 0;
}
</style>
