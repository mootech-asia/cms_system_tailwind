<template lang="pug">
div(class="block xl:flex")
  h1(class="bg-white text-[#060C34] text-[32px] font-bold xl:pt-4 pb-2 px-8 border-b border-[#E7E7E7] hidden xl:inline-block xl:w-[260px] xl:shrink-0") {{ t('userCenter.bankingDetails') }}
  section(:class="{ 'bg-[#F4F4F4]': mode === 'default', 'bg-white': mode !== 'default' }" class="h-[calc(100vh-32px)] xl:h-[calc(100vh-137px)] xl:flex-1 xl:w-auto xl:ml-0 px-4 py-4 xl:py-6")
    div(class="max-w-[945px] mx-auto")
      template(v-if="mode === 'default'")
        //- div(class="flex items-center justify-between p-2 xl:px-4 xl:py-3 bg-gradient-to-r from-[#27E0FF] via-[#71F28C] to-[#F5D36C] rounded-[10px]")
        //-     div(class="flex xl:block items-center gap-2 text-sm")
        //-       p(class="text-[#060C34] xl:font-bold") {{ t('userCenter.bankingDetailsPage.bankAccountAdded') }}： {{ accounts.length }}
        //-         span(class="xl:hidden") ,
        //-       p(class="text-[#060C34] text-sm xl:mt-1") {{ t('userCenter.bankingDetailsPage.maximumAllowed') }}
        //-     button(type="button" class="w-10 h-10 rounded-full bg-[#a6acd7] text-white items-center justify-center hidden xl:block" @click="onAdd")
        //-       NuxtImg(src="/images/icon/usercenter/add.svg" alt="add" class="w-10 h-10")

        div
          template(v-if="accounts.length === 0")
            div(class="relative flex justify-center items-center rounded-[10px] bg-[#EDEDED] p-2 xl:px-6 xl:py-8 text-center gap-2 xl:gap-8")
              div(class="min-w-[70px] min-h-[65px] xl:min-h-[100px] flex justify-center items-center xl:border-none rounded-[10px]")
                NuxtImg(src="/images/userCenter/bankcard.png" alt="empty" class="w-[50px] h-[50px] xl:w-[100px] xl:h-[100px]")
              div(class="flex flex-col items-center")
                p(class="text-[#060C34] text-sm xl:text-2xl font-bold xl:mt-4") {{ t('userCenter.bankingDetailsPage.emptyBankAccount') }}
                button(type="button" class="h-[27px] rounded-full bg-[#FFE74D] hover:bg-[#FFD80D] text-sm xl:text-md text-[#060C34] font-bold items-center justify-center shadow-[0_4px_0_#0A1140] px-2 xl:px-4 py-1 mt-2 xl:mt-4 duration-300 leading-[20px]"
                  @click="onAdd") {{ t('userCenter.bankingDetailsPage.addAccount') }}

              button(type="button" class="fixed bottom-10 right-10 z-40 w-10 h-10 rounded-full text-white items-center justify-center" @click="onAdd")
                NuxtImg(src="/images/icon/usercenter/add.svg" alt="add" class="w-10 h-10")

          template(v-else-if="accounts.length > 0")
            div(v-for="acc in accounts" :key="acc.id" class="rounded-[10px] bg-white border border-[#E5E7EB] shadow-sm p-2 xl:px-6 xl:py-4 mb-2 last:mb-0")
              //- Mobile
              template(class="block xl:hidden")
                div(class="flex gap-2 items-center")
                  div(class="w-full text-sm")
                    div(class="flex items-center gap-2 text-[#0A1140]")
                      NuxtImg(src="/images/icon/usercenter/checkmark.svg" alt="check" class="w-4 h-4")
                      p(class="font-bold") {{ t('userCenter.bankingDetailsPage.activeBankAccount') }}
                    div(class="flex items-center justify-between")
                      p(class="text-[#0A1140] font-bold mt-1 truncate") {{ acc.bankName }} 
                        span(class="font-normal") {{ t('userCenter.bankingDetailsPage.bank') }}
                      //- button(type="button" class="inline-flex items-center justify-center text-[#E11D48]" @click="onRemove(acc.id)")
                      //-   NuxtImg(src="/images/icon/usercenter/delete.svg" alt="delete" class="w-4 h-4")
                    div(class="flex items-center justify-between mt-1")
                      p(class="text-[#9CA3AF] text-sm") {{ acc.bankCardNumber }}

              //- PC
              template(class="hidden xl:block")
                div(class="flex justify-between gap-4 items-center")
                  div(class="min-w-0")
                    div(class="flex items-center gap-1 text-[#28262F]")
                      NuxtImg(src="/images/icon/usercenter/checkmark.svg" alt="check" class="w-5 h-5")
                      p(class="font-bold") {{ t('userCenter.bankingDetailsPage.activeBankAccount') }}
                    p(class="text-[#28262F] font-bold mt-1 truncate") {{ acc.bankName }} 
                      span(class="font-normal") {{ t('userCenter.bankingDetailsPage.bank') }}
                    p(class="text-[#28262F] text-sm mt-0.5") {{ acc.bankCardNumber }}
                  //- button(type="button" class="inline-flex items-center justify-center text-[#E11D48] mt-1" @click="onRemove(acc.id)")
                  //-   NuxtImg(src="/images/icon/usercenter/delete.svg" alt="delete" class="min-w-8 h-8")

            button(v-if="accounts.length < 5" type="button" class="fixed bottom-6 right-6 xl:bottom-[100px] xl:right-[100px] z-40 w-10 h-10 xl:w-[62px] xl:h-[62px] rounded-full bg-[#a6acd7] text-white items-center justify-center shadow-[0_8px_8px_rgba(6,12,52,0.35)]" @click="onAdd")
              NuxtImg(src="/images/icon/usercenter/add.svg" alt="add" class="w-10 h-10 xl:w-[62px] xl:h-[62px]")

      template(v-else-if="mode === 'addBankAccount'")
        div(class="relative xl:h-[calc(100vh-258px)] mx-auto")
          div(class="text-center")
            span(class="hidden xl:inline-block px-6 py-1.5 rounded-full bg-[#0A1140] text-white") {{ t('userCenter.bankingDetailsPage.bankInformation') }}
          div(class="space-y-4 xl:mt-4")
            div(ref="bankBoxRef" class="relative")
              div(class="w-full h-10 rounded-md border border-[#0A1140] px-3 text-[#060C34] flex items-center justify-between cursor-pointer bg-white select-none" @click="toggleBankOpen")
                span {{ displayBankLabel }}
                div(class="text-[#0A1140]")
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="none" stroke="#0A1140" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6")

              //- Mobile
              div(v-if="bankOpen" class="absolute z-50 left-0 right-0 mt-2 border border-[#0A1140]/40 bg-white shadow-lg rounded-md overflow-hidden hidden xl:block")
                div(class="flex items-center gap-2 px-3 h-9 border-b border-[#060C34] bg-white")
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 text-[#0A1140]")
                    path(fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z")
                  input(v-model.trim="form.bankSearch" type="text" class="w-full h-full outline-none text-[#060C34]" :placeholder="t('userCenter.bankingDetailsPage.searchABank')")
                div(class="max-h-64 overflow-y-auto divide-y divide-[#060C34]")
                  div(v-for="b in filteredBanks" :key="b.value" class="px-4 h-10 flex items-center cursor-pointer hover:bg-[#F5F7FB] text-[#060C34]" @click="selectBank(b)") {{ b.bank_name }}

              //- PC
              div(v-if="bankOpen" class="xl:hidden fixed left-0 right-0 w-[100vw] inset-0 z-[60] flex items-end justify-center bg-black/50" @click.self="bankOpen = false")
                div(ref="bankOverlayRef" class="w-screen max-w-none max-h-[70vh] rounded-t-xl bg-white shadow-xl overflow-hidden")
                  div(class="flex items-center gap-2 px-3 h-10 border-b border-[#060C34] bg-white")
                    svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 text-[#0A1140]")
                      path(fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z")
                    input(v-model.trim="form.bankSearch" type="text" class="w-full h-full outline-none text-[#060C34]" :placeholder="t('userCenter.bankingDetailsPage.searchABank')")
                  div(class="max-h-[60vh] overflow-y-auto divide-y divide-[#060C34]")
                    div(v-for="b in filteredBanks" :key="b.value" class="px-4 h-12 flex items-center cursor-pointer hover:bg-[#F5F7FB] text-[#060C34]" @click="selectBank(b)") {{ b.bank_name }}

            div(class="w-full h-10 rounded-md bg-neutral-200 px-3 text-neutral-500 flex items-center select-none")
              span {{ userStore.profile?.real_name || '' }}

            div(class="relative")
              input(:type="showCardNumber ? 'text' : 'password'" :value="formattedCardNumber" @input="onCardNumberInput" class="w-full h-11 rounded-md border border-[#B0B0B0] pl-3 pr-10 text-[#060C34] focus:outline-none" :placeholder="t('userCenter.bankingDetailsPage.enterCardNumber')")
              button(type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A1140]" @click="showCardNumber = !showCardNumber")
                NuxtImg(v-if="!showCardNumber" src="/images/icon/eye.svg" alt="eye" class="w-5 h-5")
                NuxtImg(v-else src="/images/icon/eye-show.svg" alt="eye-show" class="w-5 h-5")

          //- Transaction Password
          div(class="text-center pt-2")
            span(class="hidden xl:inline-block px-5 py-1.5 rounded-full bg-[#0A1140] text-white text-sm font-semibold") {{ t('userCenter.bankingDetailsPage.transactionPassword') }}
          div(class="space-y-4 mt-2 xl:mt-4")
            div(class="relative")
              input(:type="showTxPwd ? 'text' : 'password'" v-model="form.fundPassword" class="w-full h-11 rounded-md border border-[#B0B0B0] pl-3 pr-10 text-[#060C34] focus:outline-none" :placeholder="t('userCenter.bankingDetailsPage.fillTransactionPassword')")
              button(type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A1140]" @click="showTxPwd = !showTxPwd")
                NuxtImg(v-if="!showTxPwd" src="/images/icon/eye.svg" alt="eye" class="w-5 h-5")
                NuxtImg(v-else src="/images/icon/eye-show.svg" alt="eye-show" class="w-5 h-5")

          //- div(class="fixed xl:absolute bottom-0 left-0 right-0 z-40 text-[#F6E27B] xl:rounded")
          //-   div(class="w-full xl:max-w-[1190px] mx-auto px-4")
          //-     button(type="button" class="w-full h-12 rounded-lg bg-[#0A1140] flex items-center justify-center" @click="submit")
          //-       span(class="text-gradient-primary font-semibold") {{ t('common.submit') }}
          //-   button(type="button" class="xl:mt-4 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="navigateTo('/usercenter')") {{ t('common.back') }}
            
          div(class="fixed xl:absolute bottom-0 left-0 right-0 mt-[52px]")
            button(
              type="button"
              class="w-full h-[51px] flex justify-center items-center xl:rounded-[10px] bg-[#0A1140] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              @click="submit"
            )
              p(class="w-fit text-gradient-primary") {{ t('common.submit') }}
            button(type="button" class="xl:mt-4 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="router.go(-1)") {{ t('common.back') }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, onMounted, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#imports'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import { api } from '~/composables/useApi'

const store = useGlobalUiStore()
const { t } = useI18n()
const userStore = useUserStore()
const alert = useAlertStore()
const config = useRuntimeConfig()

const route = useRoute()
const router = useRouter()

const mode = ref('default')
const localShow = ref(false)
const securityData = ref({})

const accounts = ref([])

onMounted(() => {
  initMode()
  initBankList()
  getBankCardList()
  getSecurityCenter()
})

function initMode() {
  const type = route.query.type
  if (type === 'addBankAccount') {
    mode.value = 'addBankAccount'
  } else {
    mode.value = 'default'
  }
}

async function initBankList() {
  const { data } = await api.getBankList()
  banks.value = data.banks
}

async function getSecurityCenter() {
  const res = await api.getSecurityCenter()
  securityData.value = res.data
}

watch(
  () => route.query.type,
  async () => {
    await nextTick()
    initMode()
    getBankCardList()
  },
)

function onAdd() {
  if (accounts.value.length >= 5) return
  if (!securityData.value.bindFundPassword.enabled) {
    alert.openError(t('userCenter.withdrawalPage.completeTransactionPassword'), {
      cancellable: false,
      redirectUrl: '/usercenter/changepassword?type=tsps',
    })
    return
  }
  mode.value = 'addBankAccount'
  navigateTo('/usercenter/bankingdetails?type=addBankAccount')
}

function onRemove(id) {
  alert.onConfirmCallback = async () => {
    try {
      await api.deleteBankCard({ bankCardId: id })
      await getBankCardList()
      alert.openSuccess(t('common.bankCardUnboundSuccess'))
    } catch (error) {
      alert.openError(error.message)
    }
  }

  alert.openConfirmation(t('common.confirmUnbindBankCard'), { cancellable: true })
}

const banks = ref([])

const form = ref({
  account: '',
  bankSearch: '',
  fundPassword: '', // transaction password
  username: userStore.profile?.username, // 這個帳號的username
  bankBranch: '', // 通常是空的
  bankCardNumber: '',
  bankName: '',
  brandId: config.public.brandId, // 系統的brandID
  cardholderName: userStore.profile?.real_name,
})

const showTxPwd = ref(false)
const showCardNumber = ref(true)

const nickname = ref(
  route && route.query && typeof route.query.nickname === 'string'
    ? route.query.nickname
    : 'M*****',
)
const maskedNickname = computed(() => {
  const n = nickname.value || ''
  if (!n) return ''
  if (n.length === 1) return n
  return n[0] + '*'.repeat(n.length - 1)
})

const bankOpen = ref(false)
const bankBoxRef = ref(null)
const bankOverlayRef = ref(null)
const filteredBanks = computed(() => {
  const q = form.value.bankSearch.toLowerCase()
  if (!q) return banks.value
  return banks.value.filter((b) => b.label.toLowerCase().includes(q))
})
const displayBankLabel = computed(() => {
  const cur = banks.value.find((b) => b.bank_display_code === form.value.bankName)
  return cur ? cur.bank_name : t('userCenter.bankingDetailsPage.chooseABank')
})
function toggleBankOpen() {
  bankOpen.value = !bankOpen.value
}
function selectBank(b) {
  form.value.bankName = b.bank_display_code
  bankOpen.value = false
}

function formatCardNumber(digits) {
  const len = digits.length

  if (!len) return ''

  // 15 digits: 4-6-5 (e.g. xxxx xxxxxx xxxxx)
  if (len === 15) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`.trim()
  }

  // 18 digits: 4-4-4-4-2 (e.g. xxxx xxxx xxxx xxxx xx)
  if (len === 18) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)} ${digits.slice(16)}`.trim()
  }

  // 19 digits: 4-4-4-4-3 (common CN debit cards)
  if (len === 19) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)} ${digits.slice(16)}`.trim()
  }

  // Default: group every 4 digits (covers 16-digit and others while typing)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

const formattedCardNumber = computed(() => {
  const digits = (form.value.bankCardNumber || '').replace(/\D/g, '')
  return formatCardNumber(digits)
})

function onCardNumberInput(e) {
  const raw = e.target.value || ''
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  form.value.bankCardNumber = digits
  e.target.value = formatCardNumber(digits)
}

async function addBankCard() {
  const addBankCard = await api.addBankCard(form.value)
}

async function getBankCardList() {
  const { data } = await api.getBankCardList()
  accounts.value = data || []
}

function handleClickOutside(e) {
  const el = bankBoxRef.value
  const overlay = bankOverlayRef.value
  if (!el) return
  const target = e.target
  const inBox = el.contains(target)
  const inOverlay = overlay ? overlay.contains(target) : false
  if (!inBox && !inOverlay) bankOpen.value = false
}

async function submit() {
  try {
    await api.addBankCard(form.value)

    if (route.query.from === 'withdrawal') {
      alert.openSuccess(t('common.bankCardAddedSuccess'), {
        redirectUrl: '/usercenter/withdrawal',
      })
    } else {
      alert.openSuccess(t('common.bankCardAddedSuccess'), {
        redirectUrl: '/usercenter/bankingdetails',
      })
    }
  } catch (error) {
    console.error(error)
    alert.openError(error.message)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
