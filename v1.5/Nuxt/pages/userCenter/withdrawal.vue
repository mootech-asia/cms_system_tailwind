<template lang="pug">
div(class="h-screen xl:h-[calc(100vh-137px)] xl:w-[calc(100vw-260px)] xl:ml-[260px] bg-white")
  h1(class="text-[#060C34] text-[32px] font-bold xl:pt-4 pb-2 px-8 border-b border-[#E7E7E7] hidden xl:block") {{ t('userCenter.withdrawal') }}
  section(class="px-4 xl:px-8 pb-32 xl:pb-10 pt-2 xl:pt-4 bg-white")
    div(class="max-w-[945px] mx-auto")
      div(class="flex items-center justify-center text-[#3f3f42] px-2")
        div(class="flex items-center gap-2.5 text-sm font-bold")
          img(v-if="currentBankCardIndex !== 0" src="/images/icon/arrow-left.svg" alt="arrow" class="w-4 h-4 cursor-pointer" @click="updateBankCardIndex('prev')") 
          p
          span {{ t('userCenter.withdrawalPage.myBankAccounts') }}
          span(v-if="bankCardList.length > 0") {{ currentBankCardIndex + 1 }} / {{ bankCardList.length }}
          img(v-if="currentBankCardIndex < bankCardList.length - 1" src="/images/icon/arrow-right.svg" alt="arrow" class="w-4 h-4 cursor-pointer" @click="updateBankCardIndex('next')")

      //- Empty bank account
      div(v-if="bankCardList.length === 0" class="flex flex-col xl:flex-row justify-center items-center px-6 xl:px-0 text-center gap-2 xl:gap-8 mt-2 xl:mt-4")
        div(class="w-full bg-[#EDEDED] mx-6 xl:mx-0 rounded-[10px] py-3")
          NuxtImg(src="/images/userCenter/bankcard.png" alt="empty" class="w-[100px] h-[100px] mx-auto")
          div(class="flex flex-col items-center")
            p(class="text-[#060C34] text-sm xl:text-2xl font-bold mt-4") {{ t('userCenter.withdrawalPage.emptyBankAccount') }}
            button(type="button" class="h-[27px] rounded-full bg-[#FFE74D] hover:bg-[#FFD80D] text-[#060C34] text-sm xl:text-base font-bold inline-flex items-center justify-center shadow-[0_4px_0_#0A1140] px-4 py-1 mt-2 xl:mt-4 duration-300"
              @click="checkSecurityData") {{ t('userCenter.withdrawalPage.addAccount') }}

      div(v-else class="mt-4")
        div(class="relative rounded-[10px] overflow-hidden text-white mx-6 xl:mx-0")
          NuxtImg(src="/images/userCenter/bankcard2.png" alt="card-bg" class="absolute inset-0 w-full h-full object-cover")
          div(class="relative h-[184px] xl:h-[175px] px-4 xl:px-6 py-4")
            div(class="flex justify-between items-center w-full")
              p(class="w-[114px] h-[25px] bg-[#060C34CC]/80 text-white rounded font-bold text-center text-xs xl:text-[14px] leading-[26px]") {{ currentBankCardData.bankName }}
              button(v-if="bankCardList.length < 5" type="button" class="w-6 h-6 xl:w-10 xl:h-10 rounded-full text-white items-center justify-center" @click="navigateTo('/usercenter/bankingdetails?type=addBankAccount&from=withdrawal')")
                NuxtImg(src="/images/icon/usercenter/add.svg" alt="add" class="w-6 h-6 xl:w-10 xl:h-10")
            div(class="flex flex-col items-center justify-center text-center text-white mt-5 xl:mt-0")
              p(class="text-base") {{ t('userCenter.withdrawalPage.accountNumber') }}
              p(class="text-2xl font-bold tracking-wider") {{ currentBankCardData.bankCardNumber }}
            div(class="flex items-end xl:items-center justify-between w-full text-white mt-2 xl:mt-0")
              p(class="text-xs xl:text-base text-[#ffe373] font-bold") {{ currentBankCardData.cardholderName }}
              div(class="text-right")
                p(class="text-xs xl:text-sm") {{ t('userCenter.withdrawalPage.bindDate') }}
                p(class="text-xs xl:text-base font-bold") {{ dayjs.unix(currentBankCardData.bindingTime).format('YYYY-MM-DD') }}


      div(class="flex justify-between px-6 xl:px-0 mt-2 xl:mt-4")
        //- button(v-if="currentBankCardData && bankCardList.length > 0" type="button" class="flex items-center gap-1 xl:gap-2 text-red-500 cursor-pointer" @click="unBindBankCard")
        //-   svg(xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none")
        //-     path(d="M2 4.00065H3.33333M3.33333 4.00065H14M3.33333 4.00065V13.334C3.33333 13.6876 3.47381 14.0267 3.72386 14.2768C3.97391 14.5268 4.31304 14.6673 4.66667 14.6673H11.3333C11.687 14.6673 12.0261 14.5268 12.2761 14.2768C12.5262 14.0267 12.6667 13.6876 12.6667 13.334V4.00065M5.33333 4.00065V2.66732C5.33333 2.3137 5.47381 1.97456 5.72386 1.72451C5.97391 1.47446 6.31304 1.33398 6.66667 1.33398H9.33333C9.68696 1.33398 10.0261 1.47446 10.2761 1.72451C10.5262 1.97456 10.6667 2.3137 10.6667 2.66732V4.00065M6.66667 7.33398V11.334M9.33333 7.33398V11.334" stroke="#F14258" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round")
        //-   span(class="text-xs xl:text-sm ") {{ t('userCenter.withdrawalPage.unbindThisAccount') }}
        //- button(v-else)

        button(type="button" class="flex items-center gap-1 xl:gap-2 text-[#0A1140] cursor-pointer" @click="refreshProfile")
          svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-refresh w-4 h-4 xl:w-5 xl:h-5")
            g(fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M21 12a9 9 0 1 1-2.64-6.36")
              path(d="M21 3v6h-6")
          span(class="text-xs xl:text-sm font-semibold") {{ t('userCenter.withdrawalPage.refresh') }}

      div(class="flex items-center justify-center text-center gap-[54px] xl:gap-[210px] mt-[50px] xl:mt-6")
        div(class="w-fit flex flex-col items-center")
          p(class="text-[#060C34] leading-[20px]")
            span(class="block xl:inline") {{ t('userCenter.withdrawalPage.main') }} {{ t('userCenter.withdrawalPage.wallet') }}
          p(class="w-fit text-[#060C34] font-bold text-xl xl:text-2xl") ₩ {{ formatAmount(userStore.profile?.balance) }}

      p(class="text-[#E11D48] text-center text-xs xl:text-sm mt-2") {{ t('userCenter.withdrawalPage.remainingTurnoverAmount') }}{{ formatAmount(userStore.profile?.remaining_turnover_amount) }}
        NuxtLink(class="block md:inline-block m-auto w-max mt-2 md:mt-0 md:ml-2 bg-[#E11D48] rounded-[15px] px-[10px] py-[5px] cursor-pointer text-white transition-opacity hover:opacity-85" to="/usercenter/withdrawaldetail") {{ t('common.detail') }}
      

      div(class="text-center")
        span(class="inline-block mt-8 mb-4 px-6 py-1.5 rounded-full text-sm xl:text-base bg-[#0A1140] text-white") {{ t('userCenter.withdrawalPage.withdrawalAmountAndPassword') }}

      div
        input(v-model="amount" type="text" :placeholder="amountPlaceholder" class="w-full h-10 rounded-[10px] border border-[#B0B0B0] px-4 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]" @input="onAmountInput" @blur="onAmountBlur")
      
      div(class="relative mt-4")
        input(:type="showPwd ? 'text' : 'password'" v-model.trim="password" placeholder="Please Enter Transaction Password" class="w-full h-10 rounded-[10px] border border-[#B0B0B0] px-4 pr-10 text-[#060C34] placeholder-[#6D6D6D] focus:outline-none focus:ring-2 focus:ring-[#060C34]")
        button(type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A1140]/70" @click="showPwd = !showPwd")
          NuxtImg(:src="showPwd ? '/images/icon/eye-show.svg' : '/images/icon/eye.svg'" alt="toggle" class="w-5 h-5")

      p(class="text-[#E11D48] text-xs xl:text-sm mt-4") {{ t('userCenter.depositPage.limitNote', { min: minAmountText, max: maxAmountText }) }} 

      div(class="fixed xl:relative bottom-0 left-0 right-0 mt-[52px]")
        button(
          type="button"
          class="w-full h-[51px] flex justify-center items-center xl:rounded-[10px] bg-[#0A1140] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!amount || !password"
          @click="withdrawal"
        )
          p(class="w-fit text-gradient-primary") {{ t('common.submit') }}
        button(type="button" class="xl:mt-4 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="navigateTo('/usercenter')") {{ t('common.back') }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import dayjs from 'dayjs'
import { ref, computed } from 'vue'
import { api } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'
import { formatAmount } from '~/composables/useFormat'

const { t } = useI18n()
const alert = useAlertStore()
const userStore = useUserStore()

const amount = ref('')
const minAmount = ref(10000)
const maxAmount = ref(9000000)
const password = ref('')
const showPwd = ref(false)
const bankCardList = ref([])
const currentBankCardData = ref(null)
const currentBankCardIndex = ref(0)
const securityData = ref({})

const minAmountText = computed(() => new Intl.NumberFormat('en-US').format(minAmount.value))
const maxAmountText = computed(() => new Intl.NumberFormat('en-US').format(maxAmount.value))
const amountPlaceholder = computed(() => `₩ ${minAmountText.value} ~ ₩ ${maxAmountText.value}`)

onMounted(() => {
  getBankCardList()
  getSecurityCenter()
  getWithdrawalTurnover()
})

async function getSecurityCenter() {
  const res = await api.getSecurityCenter()
  securityData.value = res.data
}

function formatWithCommas(s) {
  const digits = (s || '').replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('en-US').format(Number(digits))
}

function onAmountInput(e) {
  const digits = (e.target.value || '').replace(/\D/g, '')
  const num = digits ? Math.min(Number(digits), maxAmount.value) : 0
  amount.value = digits ? new Intl.NumberFormat('en-US').format(num) : ''
}

function onAmountBlur() {
  const digits = (amount.value || '').replace(/\D/g, '')
  const num = digits ? Math.min(Number(digits), maxAmount.value) : 0
  amount.value = digits ? new Intl.NumberFormat('en-US').format(num) : ''
}

async function getBankCardList() {
  const res = await api.getBankCardList()
  bankCardList.value = res.data || []
  if (bankCardList.value.length > 0) {
    currentBankCardData.value = bankCardList.value[0]
    currentBankCardIndex.value = 0
  }
}

async function checkSecurityData() {
  if (!securityData.value.bindFundPassword.enabled) {
    alert.openError(t('userCenter.withdrawalPage.completeTransactionPassword'), {
      cancellable: false,
      redirectUrl: '/usercenter/changepassword?type=tsps',
    })
    return
  }
  navigateTo('/usercenter/bankingdetails?type=addBankAccount')
}

function updateBankCardIndex(direction) {
  if (direction === 'prev' && currentBankCardIndex.value > 0) {
    currentBankCardIndex.value--
    currentBankCardData.value = bankCardList.value[currentBankCardIndex.value]
  } else if (direction === 'next' && currentBankCardIndex.value < bankCardList.value.length - 1) {
    currentBankCardIndex.value++
    currentBankCardData.value = bankCardList.value[currentBankCardIndex.value]
  }
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
  userStore.setProfile({ ...data, remaining_turnover_amount: tData.remaining })
}

async function unBindBankCard() {
  alert.onConfirmCallback = async () => {
    try {
      await api.deleteBankCard({ bankCardId: currentBankCardData.value.id })
      await getBankCardList()
      alert.openSuccess(t('common.bankCardUnboundSuccess'))
    } catch (error) {
      alert.openError(error.message)
    }
  }

  alert.openConfirmation(t('common.confirmUnbindBankCard'), { cancellable: true })
}

async function getWithdrawalTurnover() {
  try {
    const { data } = await api.getTurnoverWithdrawal()
    userStore.setProfile({ ...userStore.profile, remaining_turnover_amount: data.remaining })
  } catch(error) {
    alert.openError(error.message)
  }
}

async function withdrawal() {
  if (bankCardList.value.length === 0) {
    alert.openError(t('userCenter.withdrawalPage.bankCardInfoRequired'))
    return
  }

  if (!currentBankCardData.value) {
    alert.openError(t('userCenter.withdrawalPage.bankCardInfoRequired'))
    return
  }

  if (!amount.value) {
    alert.openError(t('userCenter.withdrawalPage.amountRequired'))
    return
  }

  if (Number(amount.value.replace(/,/g, '')) < minAmount.value) {
    alert.openError(t('userCenter.depositPage.limitNote', { min: minAmount.value, max: maxAmount.value }))
    return
  }

  if (!password.value) {
    alert.openError(t('userCenter.withdrawalPage.passwordRequired'))
    return
  }

  if (Number(userStore.profile?.remaining_turnover_amount) > 0) {
    alert.openError(t('userCenter.withdrawalPage.turnoverNotCompletedRemaining', { amount: formatAmount(userStore.profile?.remaining_turnover_amount) }))
    return
  }

  userStore.setWithdrawalFormData({
    amount: amount.value.replace(/,/g, ''),
    band_card_id: currentBankCardData.value.id.toString(),
    transaction_password: password.value,
  })

  navigateTo(`/usercenter/transactioninfo?type=withdrawal&amount=${amount.value}`)
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
