<template lang="pug">
h1(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.accountRecord.title') }}
section(class="h-[calc(100vh-48px)] xl:h-[calc(100vh-199px)] bg-[#F2F2F2] px-4 py-3 xl:py-6 pb-24 xl:ml-[260px] overflow-y-auto overflow-x-hidden")
  div(class="w-full xl:relative xl:max-w-[1190px] xl:h-[calc(100vh-258px)] mx-auto")
    div(class="space-y-2 xl:space-y-3 pb-24")

      //- Search
      //- div(class="relative")
      //-   input(v-model.trim="keyword" type="text" :placeholder="t('userCenter.common.searchBy')" class="w-full h-10 text-sm rounded-[10px] bg-white border border-[#E5E7EB] px-10 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]")
      //-   div(class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6D6D]")
      //-     svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
      //-       path(fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14")
      
      //- Tags
      div(class="w-full xl:flex overflow-x-auto gap-2 no-scrollbar")
        div(class="flex items-center gap-2")
          button(type="button" class="shrink-0 whitespace-nowrap px-2 h-10 rounded-lg bg-white border border-[#E5E7EB] text-[#060C34] text-sm" @click="selectedOpen = !selectedOpen") {{ t('userCenter.common.tags.status') }} {{ statusText ? `: ${statusText}` : null }}
          DateRangePicker(v-model="dateRange" :placeholder="t('userCenter.common.tags.time')" dateFormat="yy/mm/dd" @clear="clearDate" class="cursor-pointer")
        button(class="w-full xl:w-auto bg-[#060C34] text-white font-bold px-3 py-2 rounded-md mt-2 xl:mt-0" @click="resetAndFetch") {{ t('common.confirm') }}
      StatusSelect(v-model:open="selectedOpen" :items="selectList" @select="selectStatus")

      //- DataList
      div(class="mt-4 overflow-auto xl:hidden")
        table(class="w-full text-xs text-center bg-white rounded-[10px] overflow-hidden")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="py-3 w-[90px]") {{ t('userCenter.common.headers.transactionType') }}
              th(class="py-3 w-[62px]") {{ t('userCenter.common.headers.time') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.common.headers.transactionAmount') }}
              th(class="py-3 w-[60px]") {{ t('userCenter.common.headers.transactionNo') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="border-b border-[#E5E7EB] cursor-pointer" @click="openDetail(r)")
              td(class="py-3 text-[#060C34]") {{ r.transaction_type ? r.transaction_type.charAt(0).toUpperCase() + r.transaction_type.slice(1) : '' }}
              td(class="py-3 text-[#060C34]") {{ dayjs.unix(r.time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="py-3 font-bold text-[#060C34]") {{ r.transaction_amount ? formatAmount(r.transaction_amount) : '-' }}
              td(class="py-3 font-bold" :class="r.order_details === 'Approved' ? 'text-[#1DBF73]' : r.order_details === 'Reject' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ r.order_details }}

      //- PC  
      div(class="hidden xl:block mt-4 overflow-x-auto")
        table(class="w-full min-w-[1000px] text-sm text-center bg-white rounded-[10px] overflow-hidden")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="px-4 py-3 w-[140px]") {{ t('userCenter.common.headers.transactionType') }}
              th(class="px-4 py-3 w-[140px]") {{ t('userCenter.common.headers.time') }}
              th(class="px-4 py-3 w-[160px]") {{ t('userCenter.common.headers.transactionAmount') }}
              th(class="px-4 py-3 w-[160px]") {{ t('userCenter.common.headers.currentBalance') }}
              th(class="px-4 py-3 w-[140px]") {{ t('userCenter.common.headers.transactionNo') }}
              th(class="px-4 py-3 w-[140px]") {{ t('userCenter.common.headers.content') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="text-[#060C34] bg-white border-b border-[#E5E7EB]")
              td(class="px-4 py-3") {{ r.transaction_type ? r.transaction_type.charAt(0).toUpperCase() + r.transaction_type.slice(1) : '' }}
              td(class="px-4 py-3") {{ dayjs.unix(r.time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="px-4 py-3") {{ r.transaction_amount ? formatAmount(r.transaction_amount) : '-' }}
              td(class="px-4 py-3 font-bold") {{ r.current_balance ? formatAmount(r.current_balance) : '-' }}
              td(class="px-4 py-3") {{ r.transaction_number }}
              td(class="px-4 py-3 font-bold" :class="r.order_details === 'Approved' ? 'text-[#1DBF73]' : r.order_details === 'Reject' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ r.order_details }}

      //- Infinite scroll sentinel
      div(ref="sentinel" class="h-8 w-full")

    //- Mobile Detail
    div(v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center")
      div(class="absolute inset-0 bg-black/50" @click="closeDetail")
      div(class="relative bg-white rounded-[10px] w-[90%] max-w-[560px] px-6 py-4 text-[#060C34]")
        div(class="flex items-center justify-between")
          div(class="flex items-center gap-1")
            p(class="text-[#060C34] text-sm font-bold truncate-2-lines") {{ detail.transaction_type.charAt(0).toUpperCase() + detail.transaction_type.slice(1) }}
          div(class="text-right text-[#2D3471]")
            p(class="text-xs leading-4") {{ dayjs.unix(detail.time).format('YYYY-MM-DD') }}
            p(class="text-xs leading-4 mt-1") {{ dayjs.unix(detail.time).format('HH:mm:ss') }}
          button(type="button" class="absolute right-0 top-[-24px] w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white" @click="closeDetail")
            NuxtImg(src="/images/icon/usercenter/close.svg" alt="close" class="w-3 h-3")

        div(class="relative my-2 h-5")
          div(class="absolute left-0 right-1 top-1/2 -translate-y-1/2 h-px bg-[#E7E7E7]")
          div(class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")
          div(class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")

        div(class="grid grid-cols-1 gap-1 text-[#060C34]")
          p(class="text-sm") {{ t('userCenter.common.headers.transactionAmount') }}：{{ detail.transaction_amount ? formatAmount(detail.transaction_amount) : '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.currentBalance') }}：{{ detail.current_balance ? formatAmount(detail.current_balance) : '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.transactionNo') }} ：
            span(class="mr-1") {{ detail.transaction_number }}
            button(type="button" class="inline-flex items-center text-[#2D3471] ml-1" @click="copy(detail.transaction_number)")
              NuxtImg(src="/images/icon/usercenter/copy.svg" alt="copy" class="w-4 h-4")
          p(class="text-sm") {{ t('userCenter.common.headers.content') }}：
            span(class="font-bold" :class="detail.order_details === 'Approved' ? 'text-[#1DBF73]' : detail.order_details === 'Reject' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ detail.order_details }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { api } from '~/composables/useApi'
import { useI18n } from '#imports'
import { formatAmount } from '~/composables/useFormat'
import { useAlertStore } from '~/stores/alert'
import dayjs from 'dayjs'

const { t, locale } = useI18n()
const alertStore = useAlertStore()

const totalAmount = ref(0)
const status = ref('')
const today = new Date()
const dateRange = ref([today, today])
const selectedOpen = ref(false)
const selectList = computed(() => {
  const _ = locale.value
  return [
    { value: 'all', label: t('userCenter.common.selectList.all') },
    { value: 'deposit', label: t('userCenter.common.selectList.deposit') },
    { value: 'withdraw', label: t('userCenter.common.selectList.withdraw') },
    { value: 'transfer', label: t('userCenter.common.selectList.transfer') },
    { value: 'rebate', label: t('userCenter.common.selectList.rebate') },
    { value: 'game', label: t('userCenter.common.selectList.game') },
    { value: 'bonus', label: t('userCenter.common.selectList.bonus') },
  ]
})

const statusText = computed(() => {
  const matched = selectList.value.find((i) => i.value === status.value)
  return matched ? matched.label : ''
})

const records = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loadingMore = ref(false)
const sentinel = ref(null)
let observer

const showDetail = ref(false)
const detail = ref({})

const hasMore = computed(() => {
  if (!total.value) {
    return records.value.length > 0
  }
  return records.value.length < total.value
})

onMounted(() => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.backgroundColor = '#F2F2F2'
  }
  resetAndFetch()
  initObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = undefined
  }
})

async function getAccountRecord() {
  const startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
  const endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD')

  const { data } = await api.getAccountRecord({
    type: status.value,
    page: page.value,
    page_size: pageSize.value,
    start_date: startDate,
    end_date: endDate,
  })

  if (data.records.length) {
    data.records.forEach((r) => {
      totalAmount.value += r.transaction_amount
    })
  }

  records.value = [...records.value, ...data.records]
  total.value = data.total || 0
}

function initObserver() {
  if (!sentinel.value) return
  if (observer) observer.disconnect()

  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry && entry.isIntersecting) {
      loadMore()
    }
  })

  observer.observe(sentinel.value)
}

async function loadMore() {
  if (loadingMore.value) return
  if (!records.value.length) return
  if (!hasMore.value) return

  loadingMore.value = true
  try {
    page.value += 1
    await getAccountRecord()
  } finally {
    loadingMore.value = false
  }
}

function clearDate() {
  dateRange.value = [today, today]
}

function openDetail(r) {
  detail.value = r
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
}

function selectStatus(b) {
  status.value = b.value
  selectedOpen.value = false
}

function copy(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

async function resetAndFetch() {
  const start = dateRange.value?.[0]
  const end = dateRange.value?.[1]
  if (!start || !end || !dayjs(start).isValid() || !dayjs(end).isValid()) {
    alertStore.openError(t('common.invalidDateRange'), { cancellable: false })
    return
  }

  page.value = 1
  total.value = 0
  records.value = []
  totalAmount.value = 0
  await getAccountRecord()
}
</script>
