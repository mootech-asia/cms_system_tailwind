<template lang="pug">
h1(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.depositRecord') }}
section(class="h-[calc(100vh-48px)] xl:h-[calc(100vh-199px)] bg-[#F2F2F2] px-4 py-3 xl:py-6 pb-24 xl:ml-[260px] overflow-y-auto")
  div(class="w-full xl:relative xl:max-w-[1190px] xl:h-[calc(100vh-258px)] mx-auto")
    div(class="space-y-2 xl:space-y-3 pb-24")

      //- Search
      //- div(class="relative")
      //-   input(v-model.trim="keyword" type="text" :placeholder="t('userCenter.common.searchBy')" class="w-full h-10 text-sm rounded-[10px] bg-white border border-[#E5E7EB] px-10 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]")
      //-   div(class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6D6D]")
      //-     svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
      //-       path(fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14")
      
      //- Tags
      div(class="w-full overflow-x-auto gap-2 no-scrollbar")
        div(class="xl:flex justify-between items-center gap-2")
          div(class="flex gap-2")
            button(type="button" class="shrink-0 whitespace-nowrap px-2 h-10 rounded-lg bg-white border border-[#E5E7EB] text-[#060C34] text-sm" @click="selectedOpen = !selectedOpen") {{ t('userCenter.common.tags.status') }}{{ statusText ? `: ${statusText}` : null }}
            DateRangePicker(v-model="dateRange" :placeholder="t('userCenter.common.tags.time')" dateFormat="yy/mm/dd" @clear="clearDate" class="cursor-pointer")
            button(class="hidden xl:inline-flex w-1/2 xl:w-auto bg-[#060C34] text-white font-bold px-3 py-2 rounded-md whitespace-nowrap items-center justify-center" @click="resetAndFetch") {{ t('common.confirm') }}
          div(class="flex gap-2 mt-2 xl:mt-0")
            button(class="xl:hidden w-1/2 xl:w-auto bg-[#060C34] text-white font-bold px-3 py-2 rounded-md" @click="resetAndFetch") {{ t('common.confirm') }}
            div(class="flex items-center shrink-0 whitespace-nowrap px-3 h-10 rounded-lg bg-white border border-[#E5E7EB] text-[#060C34] text-sm") 
              p(class="text-[#6D6D6D] text-sm") {{ t('userCenter.common.autoRefresh.in') }}
              span(class="text-[#060C34] text-sm font-bold pl-2") {{ autoRefreshSecondsLeft }}
              span(class="text-[#6D6D6D] text-sm border-r pr-2") {{ t('userCenter.common.autoRefresh.secondsShort') }}
              NuxtImg(
                src="/images/icon/refresh-blue.svg"
                alt="refresh"
                class="icon-refresh w-5 h-5 xl:w-6 xl:h-6 ml-1"
                :class="refreshIconClass"
                @click="onManualRefresh"
                @animationend="onRefreshIconAnimationEnd"
              )
      
      StatusSelect(v-model:open="selectedOpen" :items="selectList" @select="selectStatus")

      //- DataList
      div(class="mt-4 overflow-auto xl:hidden")
        table(class="w-full text-xs text-center bg-white rounded-[10px] overflow-hidden")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="py-3 w-[90px]") {{ t('userCenter.common.headers.transactionNo') }}
              th(class="py-3 w-[62px]") {{ t('userCenter.common.headers.datetime') }}
              th(class="py-3 w-[80px]") {{ t('userCenter.common.headers.depositAmountHeader') }}
              th(class="py-3 w-[60px]") {{ t('userCenter.common.headers.status') }}
              th(class="py-3 w-[60px]") {{ t('userCenter.common.headers.proceed') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="text-[#060C34] border-b border-[#E5E7EB] cursor-pointer" @click="openDetail(r)")
              td(class="py-3 px-1 ") {{ r.transaction_number }}
              td(class="py-3 px-1") {{ dayjs.unix(r.request_time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="py-3 px-1") {{ r.deposit_amount ? formatAmount(r.deposit_amount) : '-' }}
              td(class="py-3 px-1 font-bold" :class="r.status === 'Approved' ? 'text-[#1DBF73]' : r.status === 'Rejected' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ r.status }}
              td(class="py-3 px-1 whitespace-nowrap") {{ `${!r.min_turnover_amount ? '-' : formatAmount(r.current_bet_amount)} / ${!r.min_turnover_amount ? '-' : formatAmount(r.min_turnover_amount)}` }}

      //- PC
      div(class="hidden xl:block mt-4 overflow-x-auto pb-10")
        table(class="w-full min-w-[1240px] table-auto border-collapse text-sm text-center whitespace-nowrap")
          thead(class="bg-[#F6E27B] text-[#060C34] font-bold")
            tr
              th(class="px-3 py-3 min-w-[136px] first:rounded-tl-[10px]") {{ t('userCenter.common.headers.transactionNo') }}
              th(class="px-3 py-3 min-w-[111px]") {{ t('userCenter.common.headers.datetime') }}
              th(class="px-3 py-3 min-w-[148px]") {{ t('userCenter.common.headers.depositAmountHeader') }}
              th(class="px-3 py-3 min-w-[86px]") {{ t('userCenter.common.headers.status') }}
              th(class="px-3 py-3 min-w-[116px]") {{ t('userCenter.common.headers.requestAmountHeader') }}
              th(class="px-3 py-3 min-w-[116px]") {{ t('userCenter.common.headers.bonus') }}
              th(class="px-3 py-3 min-w-[120px]") {{ t('userCenter.common.headers.proceed') }}
              th(class="px-3 py-3 min-w-[120px]") {{ t('userCenter.common.headers.method') }}
              th(class="px-3 py-3 min-w-[120px]") {{ t('userCenter.common.headers.bankReference') }}
              th(class="px-3 py-3 min-w-[127px]") {{ t('userCenter.common.headers.depositedTime') }}
              th(class="px-3 py-3 min-w-[116px]") {{ t('userCenter.common.headers.bankCharge') }}
              th(class="px-3 py-3 min-w-[104px]") {{ t('userCenter.common.headers.promotionHeader') }}
              th(class="px-3 py-3 min-w-[85px] last:rounded-tr-[10px]") {{ t('userCenter.common.headers.remarkHeader') }}
          tbody
            tr(v-for="r in records" :key="r.id" class="text-[#060C34] bg-white border-b border-[#E5E7EB]")
              td(class="px-3 py-3") {{ r.transaction_number }}
              td(class="px-3 py-3") {{ dayjs.unix(r.request_time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="px-3 py-3") {{ r.deposit_amount ? formatAmount(r.deposit_amount) : '-' }}
              td(class="px-3 py-3 font-bold" :class="r.status === 'Approved' ? 'text-[#1DBF73]' : r.status === 'Rejected' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ r.status }}
              td(class="px-3 py-3") {{ r.request_amount ? formatAmount(r.request_amount) : '-' }}
              td(class="px-3 py-3") {{ r.bonus_amount ? formatAmount(r.bonus_amount) : '-' }}
              td(class="px-3 py-3") {{ `${!r.min_turnover_amount ? '-' : formatAmount(r.current_bet_amount)} / ${!r.min_turnover_amount ? '-' : formatAmount(r.min_turnover_amount)}` }}
              td(class="px-3 py-3") {{ r.deposit_method || '-' }}
              td(class="px-3 py-3") {{ r.bank_reference || '-' }}
              td(class="px-3 py-3") {{ r.deposited_time === 0 ? '-' : dayjs.unix(r.deposited_time).format('YYYY-MM-DD HH:mm:ss') }}
              td(class="px-3 py-3") {{ r.bank_charge ? formatAmount(r.bank_charge) : '-' }}
              td(class="px-3 py-3") {{ r.promotion || '-' }}
              td(class="px-3 py-3") {{ r.remark || '-' }}

      //- Infinite scroll sentinel
      div(ref="sentinel" class="h-8 w-full")

    div(class="fixed bottom-0 left-0 right-0 z-40 xl:left-[243px] xl:bottom-4 justify-center")
      div(class="w-full xl:max-w-[1190px] mx-auto px-4 bg-[#0A1140] text-[#F6E27B] xl:rounded")
        div(class="flex items-center justify-between h-12")
          p {{ t('userCenter.common.footer.totalDepositAmount') }}
          p(class="text-sm xl:text-base font-bold") {{ formatAmount(totalAmount) }}
      
    //- Mobile Detail
    div(v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center")
      div(class="absolute inset-0 bg-black/50" @click="closeDetail")
      div(class="relative bg-white rounded-[10px] w-[90%] max-w-[560px] px-6 py-4 text-[#060C34]")
        div(class="flex items-center justify-between")
          div(class="flex items-center gap-1")
            p(class="text-[#060C34] text-sm font-bold truncate-2-lines") {{ detail.transaction_number }}
            button(type="button" class="inline-flex items-center text-[#060C34] ml-1" @click="copy(detail.transaction_number)")
              NuxtImg(src="/images/icon/usercenter/copy.svg" alt="copy" class="min-w-4 min-h-4")
          div(class="text-right text-[#060C34]")
            p(class="text-xs leading-4") {{ dayjs.unix(detail.request_time).format('YYYY-MM-DD') }}
            p(class="text-xs leading-4 mt-1") {{ dayjs.unix(detail.request_time).format('HH:mm:ss') }}
          button(type="button" class="absolute right-0 top-[-24px] w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white" @click="closeDetail")
            NuxtImg(src="/images/icon/usercenter/close.svg" alt="close" class="w-3 h-3")

        div(class="relative my-2 h-5")
          div(class="absolute left-0 right-1 top-1/2 -translate-y-1/2 h-px bg-[#E7E7E7]")
          div(class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")
          div(class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#E7E7E7] rotate-45 rounded-[2px]")

        div(class="grid grid-cols-1 gap-1 text-[#060C34]")
          p(class="text-sm") {{ t('userCenter.common.headers.depositedTime') }}： {{ dayjs.unix(detail.deposited_time).format('YYYY-MM-DD HH:mm:ss') }}
          p(class="text-sm") {{ t('userCenter.common.headers.depositAmountHeader') }}： {{ detail.deposit_amount ? formatAmount(detail.deposit_amount) : '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.requestAmountHeader') }}：{{ detail.request_amount ? formatAmount(detail.request_amount) : '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.method') }}：{{ detail.deposit_method || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.bankReference') }}：{{ detail.bank_reference || '---' }}
          p(class="text-sm") {{ t('userCenter.common.headers.bankCharge') }}：{{ detail.bank_charge ? formatAmount(detail.bank_charge) : '---' }}
          p(class="text-sm") {{ t('userCenter.common.detail.promotions') }}： {{ detail.promotion || '---' }}
          p(class="text-sm") {{ t('userCenter.common.detail.remarks') }}： {{ detail.remark || '---' }}
          p(class="text-sm") {{ `${t('userCenter.common.headers.proceed')}： ${!detail.min_turnover_amount ? '-' : formatAmount(detail.current_bet_amount) } / ${!detail.min_turnover_amount ? '-' : formatAmount(detail.min_turnover_amount)}` }}
          p(class="text-sm") {{ t('userCenter.common.detail.status') }}：
            span(class="font-bold" :class="detail.status === 'Approved' ? 'text-[#1DBF73]' : detail.status === 'Rejected' ? 'text-[#E11D48]' : 'text-[#d19200]'") {{ detail.status }}

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
    { value: '', label: t('userCenter.common.selectList.all') },
    { value: 'Pending', label: t('userCenter.common.selectList.pending') },
    { value: 'Approved', label: t('userCenter.common.selectList.approved') },
    { value: 'Rejected', label: t('userCenter.common.selectList.rejected') },
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

let autoRefreshTimerId = null
let manualCooldownTimerId = null
let countdownTimerId = null
const isManualRefreshCoolingDown = ref(false)
const isRefreshing = ref(false)
const isRefreshAnimating = ref(false)

const nextAutoRefreshAt = ref(0)
const autoRefreshSecondsLeft = ref(30)

const showDetail = ref(false)
const detail = ref({})

const refreshIconClass = computed(() => {
  const base = isManualRefreshCoolingDown.value
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer hover:opacity-80'

  return [base, isRefreshAnimating.value ? 'refresh-spin-once' : '']
})

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

  scheduleAutoRefresh()

  if (countdownTimerId) clearInterval(countdownTimerId)
  countdownTimerId = setInterval(() => {
    const msLeft = nextAutoRefreshAt.value - Date.now()
    autoRefreshSecondsLeft.value = Math.max(0, Math.ceil(msLeft / 1000))
  }, 250)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = undefined
  }

  if (autoRefreshTimerId) {
    clearTimeout(autoRefreshTimerId)
    autoRefreshTimerId = null
  }
  if (manualCooldownTimerId) {
    clearTimeout(manualCooldownTimerId)
    manualCooldownTimerId = null
  }

  if (countdownTimerId) {
    clearInterval(countdownTimerId)
    countdownTimerId = null
  }
})

function scheduleAutoRefresh() {
  if (autoRefreshTimerId) clearTimeout(autoRefreshTimerId)

  nextAutoRefreshAt.value = Date.now() + 30_000
  autoRefreshSecondsLeft.value = 30

  autoRefreshTimerId = setTimeout(async () => {
    await triggerRefresh()
    scheduleAutoRefresh()
  }, 30_000)
}

async function triggerRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    if (!records.value.length) {
      await resetAndFetch()
      return
    }
    await refreshCurrentPage()
  } finally {
    isRefreshing.value = false
  }
}

async function onManualRefresh() {
  if (isManualRefreshCoolingDown.value) return

  isRefreshAnimating.value = false
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      isRefreshAnimating.value = true
    })
  } else {
    isRefreshAnimating.value = true
  }

  isManualRefreshCoolingDown.value = true

  if (manualCooldownTimerId) clearTimeout(manualCooldownTimerId)
  manualCooldownTimerId = setTimeout(() => {
    isManualRefreshCoolingDown.value = false
    manualCooldownTimerId = null
  }, 30_000)

  await triggerRefresh()
  scheduleAutoRefresh()
}

function onRefreshIconAnimationEnd() {
  isRefreshAnimating.value = false
}

async function getDepositWithdrawHistory() {
  const startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
  const endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD')

  const { data } = await api.getDepositWithdrawHistory({
    type: 'deposit',
    page: page.value,
    page_size: pageSize.value,
    start_date: startDate,
    end_date: endDate,
    status: status.value,
  })

  if (data.data.length) {
    data.data.forEach((r) => {
      if (r.status === 'Approved') {
        totalAmount.value += Number(r.deposit_amount || 0)
      }
    })
  }

  records.value = [...records.value, ...data.data]
  total.value = data.total || 0
}

function recomputeTotalAmountFromRecords() {
  totalAmount.value = records.value.reduce((sum, r) => {
    if (r && r.status === 'Approved') {
      return sum + Number(r.deposit_amount || 0)
    }
    return sum
  }, 0)
}

async function fetchDepositWithdrawHistoryPage(pageNumber) {
  const startDate = dayjs(dateRange.value[0]).startOf('day').format('YYYY-MM-DD')
  const endDate = dayjs(dateRange.value[1]).endOf('day').format('YYYY-MM-DD')

  const { data } = await api.getDepositWithdrawHistory({
    type: 'deposit',
    page: pageNumber,
    page_size: pageSize.value,
    start_date: startDate,
    end_date: endDate,
    status: status.value,
  })

  return data
}

async function refreshCurrentPage() {
  const currentPage = page.value
  const data = await fetchDepositWithdrawHistoryPage(currentPage)

  total.value = data.total || 0

  const startIndex = (currentPage - 1) * pageSize.value
  const deleteCount = Math.min(pageSize.value, records.value.length - startIndex)

  if (startIndex < 0 || deleteCount < 0) return
  records.value.splice(startIndex, deleteCount, ...(data.data || []))

  recomputeTotalAmountFromRecords()
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
    await getDepositWithdrawHistory()
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
  await getDepositWithdrawHistory()
}
</script>

<style scoped>
.refresh-spin-once {
  animation: refresh-spin-once 0.6s linear;
}

@keyframes refresh-spin-once {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
