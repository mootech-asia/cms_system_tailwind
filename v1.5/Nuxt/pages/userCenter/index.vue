<template lang="pug">
main(class="bg-[#F4F4F4] pb-20")
  section(class="min-h-[60vh] xl:ml-[260px] xl:w-[calc(100vw-260px)]")
    div(class="h-[62px] bg-white text-[#060C34] text-[32px] font-bold border-b border-[#E5E7EB] leading-[64px] px-8 mb-4 hidden xl:block") {{ $t('userCenter.accountOverview') }}
    
    div(class="min-h-[calc(100vh-215px)] grid grid-cols-1 xl:grid-cols-[1fr_320px] xl:px-10 pb-6")
      div

        //- User Avatar
        div(class="h-auto xl:rounded-xl bg-[#0A1140] text-white overflow-hidden relative")
          div(class="relative flex justify-start items-start gap-4 px-4 pt-6 pb-4")
            NuxtImg(src="/images/index/avatar.png" alt="avatar" class="w-[88px] h-[88px] xl:w-[94px] xl:h-[94px] rounded-full object-cover ring-2 ring-white")
            
            div
              div(class="flex xl:flex-row flex-col-reverse xl:items-center gap-1 xl:gap-2")
                div(class="flex items-center gap-1")
                  h3(class="xl:text-2xl font-bold") {{ store.profile?.username }}
                span(class="w-fit h-6 px-2 py-[2px] text-xs xl:text-lg rounded-full bg-gradient-primary  text-[#0A1140] font-bold leading-[18px] xl:leading-[20px]") {{ store.profile?.player_level_name }}
              div(class="flex items-center text-white text-xs xl:text-lg") {{ $t('userCenter.nickname') }} : {{ store.profile?.nickname }}
                NuxtImg(src="/images/icon/edit.svg" alt="edit" class="w-4 h-4 xl:w-[28px] xl:h-[28px] cursor-pointer" @click="navigateTo('/usercenter/personalinfo')")
              div(class="w-fit h-[34px] flex items-center gap-1 text-gradient-primary text-2xl xl:text-[28px] font-bold") ₩ {{ formatAmount(store.profile?.balance || 0) }}
                NuxtImg(src="/images/icon/refresh.svg" alt="refresh" class="icon-refresh w-5 h-5 xl:w-[28px] xl:h-[28px] cursor-pointer" @click="refreshProfile")
            
            div(class="hidden xl:flex flex-col gap-4")
              div(class="flex gap-2 flex-wrap justify-end")
                button(type="button" class="btn-gradient-action px-2.5 py-2 h-10 rounded-[8px] font-bold text-sm xl:text-base transition-colors duration-200" @click="navigateTo('/usercenter/deposit')") {{ $t('userCenter.deposit') }}
                button(type="button" class="btn-gradient-action px-2.5 py-2 h-10 rounded-[8px] font-bold text-sm xl:text-base transition-colors duration-200" @click="navigateTo('/usercenter/withdrawal')") {{ $t('userCenter.withdrawal') }}
              button(type="button" class="btn-hover-primary-pill inline-flex items-center justify-center px-5 h-10 rounded-lg bg-transparent border-gradient-primary-mask font-bold transition-all duration-200"
                @click="navigateTo('/usercenter/bankingdetails')")
                span(class="btn-hover-primary-pill-label text-gradient-primary") {{ $t('userCenter.bankingDetails') }}
            
            div(class="w-full hidden xl:flex flex-1 gap-4")
              div(class="w-full text-right")
                div(class="w-full flex justify-end items-center")
                  p(class="w-fit h-[34px] text-gradient-primary text-2xl xl:text-2xl font-bold") {{ $t('userCenter.rollover.title') }}
                p(class="text-white font-bold") {{ $t('userCenter.rollover.remainingTurnoverAmount') }}
                p(class="ml-2 font-normal") ₩ {{ formatAmount(store.profile?.remaining_turnover_amount) }}

          div(class="flex xl:hidden flex-col gap-4 pl-4")
            div(class="flex gap-2 flex-wrap")
              button(type="button" class="btn-gradient-action w-fit px-4 h-8 rounded-[12px] font-bold text-base transition-colors duration-200" @click="navigateTo('/usercenter/deposit')") {{ $t('userCenter.deposit') }}
              button(type="button" class="btn-gradient-action w-fit px-4 h-8 rounded-[12px] font-bold text-base transition-colors duration-200" @click="navigateTo('/usercenter/withdrawal')") {{ $t('userCenter.withdrawal') }}
              button(type="button" class="inline-flex w-fit items-center justify-center px-2 h-8 rounded-lg bg-transparent border-gradient-primary-mask text-gradient-primary font-bold text-sm hover:text-[#00D0FF]" @click="navigateTo('/usercenter/bankingdetails')") {{ $t('userCenter.bankingDetails') }}

          div(class="w-full xl:hidden flex-1 px-4 gap-4 py-4")
            div(class="w-full text-right")
              p(class="ml-auto w-fit h-[34px] text-gradient-primary text-2xl xl:text-2xl font-bold") {{ $t('userCenter.rollover.title') }}
              p(class="text-white font-bold") {{ $t('userCenter.rollover.remainingTurnoverAmount') }}
              p(class="ml-2 font-normal") ₩ {{ formatAmount(store.profile?.remaining_turnover_amount) }}

        div(class="px-4 xl:px-0 mt-4 xl:mt-6")
          //- Recent Transactions
          div(class="rounded-xl bg-white ring-1 ring-black/10")
            div(class="flex items-center justify-center xl:justify-between border-b mx-0 xl:mx-6 py-2 xl:py-3")
              h4(class="text-[#0A1140] xl:text-2xl font-bold") {{ $t('userCenter.recentTransactions') }}
              a(class="text-[#060C34] text-base font-bold items-center gap-1 hidden xl:inline-flex" href="/userCenter/accountsRecord") {{ $t('userCenter.viewMoreRecords') }}
                NuxtImg(src="/images/icon/arrow-right.svg" alt="arrow-right" class="w-4 h-4")

            div(class="px-4 xl:px-12 pb-4 space-y-2 xl:space-y-4 mt-4 xl:mt-3")
              template(v-if="records.length")
                div(v-for="(item, i) in records" :key="i" class="flex items-start justify-between border-b border-[#E5E7EB] pb-2 last:border-b-0")
                  div
                    div(class="text-sm xl:text-base text-[#060C34] font-bold") {{ item.transaction_type.charAt(0).toUpperCase() + item.transaction_type.slice(1) }}
                    div(class="text-xs xl:text-sm text-[#060C34] mt-1") {{ dayjs.unix(item.time).format('YYYY-MM-DD HH:mm:ss') }}
                  div(class="text-right")
                    div(class="text-sm xl:text-base text-[#060C34]") ₩ {{ formatAmount(item.transaction_amount) }}
                    div(class="text-xs xl:text-sm mt-1" :class="item.order_details === 'Approved' ? 'text-[#1DBF73]' : item.order_details === 'Reject' ? 'text-[#E11D48]' : 'text-[#F0BC00]'") {{ item.order_details }}

      //- Only displayed on PC
      //- Sign In
      div(class="px-4 xl:w-[334px] xl:pl-8 xl:pr-0 space-y-4")
        div(class="mt-4 xl:mt-0")
          div(class="rounded-[10px] bg-white overflow-hidden divide-y divide-[#E7E7E7]")
            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-2 text-left" @click="navigateTo('/usercenter/personalinfo')")
              NuxtImg(src="/images/icon/usercenter/personal.svg" alt="user" class="w-5 h-5")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.personalInfo') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.completeProfile') }}

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-5 py-4 text-left" @click="navigateTo('/usercenter/changepassword?type=lgps')")
              NuxtImg(src="/images/icon/usercenter/lock.svg" alt="lock" class="w-5 h-5")
              div
                p(class="text-sm text-[#060C34] font-bold")  {{ t('userCenter.changePassword.changeLogin') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.recommendAlphaNum') }}

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-5 py-4 text-left" @click="navigateTo('/usercenter/changepassword?type=tsps')")
              NuxtImg(src="/images/icon/usercenter/password.svg" alt="pin" class="w-5 h-5")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.changePassword.changeTransaction') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.setTxnPasswordTip') }}
              p(class="flex items-center text-xs" :class="securityCenter.bindFundPassword?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'") {{ securityCenter.bindFundPassword?.enabled ? t('userCenter.securityCenterPage.set') : t('userCenter.securityCenterPage.notSet') }}
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-2.5 h-2.5 ml-1" :class="securityCenter.bindFundPassword?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'")
                  path(d="M5 3l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
            
            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-5 py-4 text-left" @click="navigateTo('/usercenter/bankingdetails')")
              NuxtImg(src="/images/icon/usercenter/creditCard.svg" alt="bank" class="w-5 h-5")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.bankingDetails') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.recommendAlphaNum') }}
              p(class="flex items-center text-xs" :class="securityCenter.bankCard?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'") {{ securityCenter.bankCard?.enabled ? t('userCenter.securityCenterPage.set') : t('userCenter.securityCenterPage.notSet') }}
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-2.5 h-2.5 ml-1" :class="securityCenter.bankCard?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'")
                  path(d="M5 3l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-5 py-4 text-left" @click="logout")
              NuxtImg(src="/images/icon/usercenter/logout.svg" alt="logout" class="w-5 h-5")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.securityCenterPage.logout') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.logoutSafely') }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { formatAmount } from '~/composables/useFormat'
import { clearAuthState } from '~/composables/request/auth'
import UserSidebar from '~/components/UserSidebar.vue'
import dayjs from 'dayjs'

const store = useUserStore()
const alert = useAlertStore()
const router = useRouter()
const { t } = useI18n()

const records = ref([])
const security = ref(60)
const securityCenter = ref({})

let transactionHistoryTimerId = null
const isFetchingTransactionHistory = ref(false)

const r = 54
const c = 2 * Math.PI * r
const secDasharray = computed(() => {
  const pct = Math.max(0, Math.min(100, Number(security.value) || 0))
  const filled = (pct / 100) * c
  return `${filled} ${c}`
})
const secStrokeLinecap = computed(() =>
  security.value === 0 || security.value === 100 ? 'butt' : 'round',
)

onMounted(() => {
  getSecurityCenter()
  getTransactionHistory()

  if (transactionHistoryTimerId) clearInterval(transactionHistoryTimerId)
  transactionHistoryTimerId = setInterval(() => {
    getTransactionHistory()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (transactionHistoryTimerId) {
    clearInterval(transactionHistoryTimerId)
    transactionHistoryTimerId = null
  }
})

async function getSecurityCenter() {
  const res = await api.getSecurityCenter()
  securityCenter.value = res.data
}

async function getTransactionHistory() {
  if (isFetchingTransactionHistory.value) return
  isFetchingTransactionHistory.value = true
  const { data } = await api.getAccountRecord({
    type: 'all',
    page: 1,
    page_size: 20,
  })

  records.value = data.records
  isFetchingTransactionHistory.value = false
}

async function refreshProfile() {
  const icon = document.querySelector('.icon-refresh')
  if (icon) {
    icon.classList.add('spin-once')
    setTimeout(() => {
      icon.classList.remove('spin-once')
    }, 1000)
  }
  const [{ data }, { data: tData }] = await Promise.all([api.getProfile(), api.getTurnoverWithdrawal()])
  store.setProfile({ ...data, remaining_turnover_amount: tData.remaining })
}

async function logout() {
  try {
    await api.logout({ silent: true })
  } catch (error) {
    console.warn('Logout request failed, clearing local auth state instead.', error)
  } finally {
    clearAuthState(store)
    navigateTo('/')
  }
}
</script>
<style scoped>
@keyframes spin-once {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.icon-refresh.spin-once {
  animation: spin-once 1s linear;
}

</style>
