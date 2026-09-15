<template lang="pug">
h1(class="w-[calc(100vw-260px)] h-[62px] bg-white text-[#060C34] text-[32px] font-bold py-2 px-8 border-b border-[#E7E7E7] hidden xl:block ml-[260px]") {{ t('userCenter.securityCenter') }}
section(class="h-screen xl:h-[calc(100vh-199px)] bg-[#F2F2F2] py-4 xl:py-6 xl:pl-[260px]")
  div(class="max-w-[945px] mx-auto")
    div(class="grid grid-cols-1 gap-6")
      //- div(class="flex flex-col items-center gap-[100px]")
      //-   div(class="relative w-[220px] h-[220px] rounded-full grid place-items-center")
      //-     div(class="relative w-[200px] h-[200px]")
      //-       svg(xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" class="block")
      //-         defs
      //-           linearGradient(id="secGrad" x1="0%" y1="0%" x2="100%" y2="0%")
      //-             stop(offset="0%" stop-color="#27E0FF")
      //-             stop(offset="50%" stop-color="#71F28C")
      //-             stop(offset="100%" stop-color="#F5D36C")
      //-         circle(cx="100" cy="100" r="90" stroke="#E7E7E7" stroke-width="10" fill="none")
      //-         circle(cx="100" cy="100" r="90" stroke="url(#secGrad)" stroke-width="10" fill="none" :stroke-linecap="secStrokeLinecap" :stroke-dasharray="secDasharray" :stroke-dashoffset="secDashoffset" transform="rotate(120 100 100)")
            
      //-       div(class="absolute inset-0 flex items-center justify-center text-[#060C34]")
      //-         div(class="text-center")
      //-           div(class="text-4xl leading-none font-bold") {{ score }}%
      //-           div(class="text-xl") Security
      //-           div(class="text-xl -mt-1") Score

      //-   div(class="flex flex-col items-center")
      //-     NuxtImg(src="/images/icon/usercenter/notice.svg" alt="warn" class="w-[120px] h-[120px]")
      //-     p(class="text-[#A11E2B] text-[40px] font-bold") Low
      //-     p(class="text-xl text-[#6D6D6D]") Security Level

      div
        //- div(v-if="showBanner" class="rounded-[10px] bg-[#FFE373] p-4 relative")
        //-   div(class="flex items-start justify-between gap-4")
        //-     div(class="w-full flex justify-between items-center gap-3")
        //-       div(class="flex items-center gap-2")
        //-         NuxtImg(src="/images/icon/usercenter/notice.svg" alt="alert" class="w-6 h-6 mt-0.5")
        //-         p(class="text-[#060C34] font-bold") Safety Recommendation
        //-       NuxtImg(src="/images/icon/usercenter/error.svg" alt="alert" class="w-6 h-6 mt-0.5")
        //-   p(class="text-[#060C34] text-sm mt-4") To protect your funds, please set a strong transaction password first.
        //-   div(class="flex justify-end items-center gap-4 mt-4")
        //-     button(type="button" class="flex items-center gap-1 text-[#060C34] font-semibold" @click="onSetupNow")
        //-       NuxtImg(src="/images/icon/usercenter/setting.svg" alt="set" class="w-5 h-5")
        //-       span Set Up Now
              

        //- Last Login
        div
          p(class="text-[#060C34] text-xl font-bold mb-4 px-4") {{ t('userCenter.securityCenterPage.lastLogin') }}
          div(class="rounded-[14px] bg-white text-sm divide-y divide-[#E7E7E7]")
            div(class="grid grid-cols-[1fr_auto] items-center py-5 px-4")
              p(class="text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.time') }}
              p(class="text-[#07143F] xl:font-bold") {{ dayjs.unix(securityCenter.lastLoginTime).format('YYYY/MM/DD HH:mm:ss') }}
            div(class="grid grid-cols-[1fr_auto] items-center py-5 px-4")
              p(class="text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.ipAddress') }}
              p(class="text-[#07143F] xl:font-bold break-all") {{ securityCenter.lastLoginIp }}

        div(class="mt-4")
          p(class="text-[#060C34] text-xl font-bold mb-4 px-4") {{ t('userCenter.securityCenterPage.securitySetting') }}
          div(class="rounded-[10px] bg-white overflow-hidden divide-y divide-[#E7E7E7]")
            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-2 text-left" @click="go('/usercenter/personalinfo')")
              NuxtImg(src="/images/icon/usercenter/personal.svg" alt="user" class="w-6 h-6")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.personalInfo') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.completeProfile') }}

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 text-left" @click="go('/usercenter/changepassword?type=lgps')")
              NuxtImg(src="/images/icon/usercenter/lock.svg" alt="lock" class="w-6 h-6")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.changePassword.changeLogin') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.recommendAlphaNum') }}

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 text-left" @click="go('/usercenter/changepassword?type=tsps')")
              NuxtImg(src="/images/icon/usercenter/password.svg" alt="pin" class="w-6 h-6")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.changePassword.changeTransaction') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.setTxnPasswordTip') }}
              p(class="flex items-center text-xs" :class="securityCenter.bindFundPassword?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'") {{ securityCenter.bindFundPassword?.enabled ? t('userCenter.securityCenterPage.set') : t('userCenter.securityCenterPage.notSet') }}
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-2.5 h-2.5 ml-1" :class="securityCenter.bindFundPassword?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'")
                  path(d="M5 3l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
            
            //- BankCard
            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 text-left" @click="go('/usercenter/bankingdetails')")
              NuxtImg(src="/images/icon/usercenter/creditCard.svg" alt="bank" class="w-6 h-6")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.securityCenterPage.bankAccountNumber') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.recommendAlphaNum') }}
              p(class="flex items-center text-xs" :class="securityCenter.bankCard?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'") {{ securityCenter.bankCard?.enabled ? t('userCenter.securityCenterPage.set') : t('userCenter.securityCenterPage.notSet') }}
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-2.5 h-2.5 ml-1" :class="securityCenter.bankCard?.enabled ? 'text-[#0E8D6C]' : 'text-[#E11D48]'")
                  path(d="M5 3l6 5-6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")

            button(type="button" class="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 text-left" @click="logout")
              NuxtImg(src="/images/icon/usercenter/logout.svg" alt="logout" class="w-6 h-6")
              div
                p(class="text-sm text-[#060C34] font-bold") {{ t('userCenter.securityCenterPage.logout') }}
                p(class="text-xs text-[#6D6D6D]") {{ t('userCenter.securityCenterPage.logoutSafely') }}

</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import dayjs from 'dayjs'
import { useAlertStore } from '~/stores/alert'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { clearAuthState } from '~/composables/request/auth'

const store = useUserStore()
const alert = useAlertStore()
const router = useRouter()
const { t } = useI18n()

const score = ref(50)
const securityCenter = ref({})
const showBanner = ref(true)

const r = 90
const c = 2 * Math.PI * r
const secDasharray = computed(() => {
  const pct = Math.max(0, Math.min(100, Number(score.value) || 0))
  const filled = (pct / 100) * c
  const gap = c - filled
  return `${filled} ${gap}`
})
const secStrokeLinecap = computed(() =>
  score.value === 0 || score.value === 100 ? 'butt' : 'round',
)
const startAngle = 210
const secDashoffset = computed(() => {
  const offsetRatio = (startAngle % 360) / 360
  return c * offsetRatio
})

function onSetupNow() {
  navigateTo('/usercenter/changeTxnPassword')
}

function go(to) {
  if (to) navigateTo(to)
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

async function getSecurityCenter() {
  const res = await api.getSecurityCenter()
  securityCenter.value = res.data
}

onMounted(() => {
  getSecurityCenter()
})
</script>
