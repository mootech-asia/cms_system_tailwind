<template lang="pug">
div(class="h-[calc(100vh-32px)] xl:h-[calc(100vh-137px)] bg-white")
  h1(class="text-[#060C34] text-[32px] font-bold xl:py-2 px-8 border-b border-[#E7E7E7] hidden xl:block xl:ml-[260px]") {{ t('userCenter.personalInfo') }}
  section(class="px-4 xl:px-8 pb-20 xl:pb-10 pt-4 xl:pt-6 xl:ml-[260px] bg-white")
    div(class="relative max-w-[945px] mx-auto")
      p(class="text-[#0A1140] text-base xl:text-2xl font-bold") {{ t('userCenter.personalInfoPage.username') }} : {{ userStore.profile?.username }}

      div(class="relative mt-4 xl:mt-8")
        input(v-model="nickname" type="text" :placeholder="t('userCenter.personalInfoPage.nicknamePlaceholder')" class="w-full h-10 text-sm rounded-md border border-[#0A1140] pl-9 pr-3 text-[#060C34] focus:outline-none")
        NuxtImg(src="/images/icon/usercenter/user.svg" alt="user" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2")

      div(class="flex items-center gap-2 h-10 rounded-md px-4 xl:px-3 text-[#6D6D6D] border border-[#0A1140] mt-4 xl:mt-8")
        NuxtImg(src="/images/icon/usercenter/birthday.svg" alt="birthday" class="w-4 h-4")
        DatePicker(
          id="reg-birthday"
          v-model="birthday"
          dateFormat="yy/mm/dd"
          appendTo="body"
          :placeholder="$t('auth.placeholders.birthday')"
          class="w-full border-none"
          inputClass="w-full rounded-md bg-[#1F1F1F] text-white text-[14px] placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF]"
        )

      div(class="flex items-center gap-2 bg-[#D9D9D9] h-10 rounded-md px-4 xl:px-3 text-[#6D6D6D] mt-4 xl:mt-8")
        NuxtImg(src="/images/icon/usercenter/mail.svg" alt="mail" class="w-4 h-4")
        span(class="text-sm") {{ userStore.profile?.email }}

      div(class="flex items-center gap-2 bg-[#D9D9D9] h-10 rounded-md px-4 xl:px-3 text-[#6D6D6D] mt-4 xl:mt-8")
        NuxtImg(src="/images/icon/usercenter/id.svg" alt="id" class="w-4 h-4")
        span(class="text-sm") {{ userStore.profile?.real_name}}

      div(class="grid grid-cols-[130px_1fr] xl:grid-cols-[210px_1fr] gap-2 xl:gap-[33px] mt-4 xl:mt-8")
        div(class="w-[130px] xl:w-[210px] flex items-center justify-between bg-[#D9D9D9] h-10 rounded-md px-4 xl:px-3 text-[#6D6D6D]")
          div(class="flex items-center gap-2")
            span {{ selectedCountry?.flag || '🇰🇷' }}
            span {{ selectedCountry?.dialCode || '+86' }}
          //- NuxtImg(src="/images/icon/arrowDown.svg" alt="arrowDown" class="w-4 h-4")
        div(class="w-full flex items-center gap-2 bg-[#D9D9D9] h-10 rounded-md px-4 xl:px-3 text-[#6D6D6D]")
          svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4")
            path(fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24a11.36 11.36 0 0 0 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1a11.36 11.36 0 0 0 .57 3.58a1 1 0 0 1-.24 1.01Z")
          span {{ userStore.profile?.mobile }}

      div(class="text-center mt-8 xl:mt-10")
        span(class="inline-block xl:hidden text-sm xl:text-base px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-white") {{ t('userCenter.personalInfoPage.privacyCta') }}
        span(class="hidden xl:inline-block text-sm xl:text-base px-6 py-1 xl:py-1.5 rounded-full bg-[#0A1140] text-white") {{ t('userCenter.personalInfoPage.privacyCta') }}
      p(class="text-[#060C34] text-sm xl:text-base text-center mt-4 xl:hidden") {{ t('userCenter.personalInfoPage.privacyNote') }}
      p(class="text-[#060C34] text-sm xl:text-base text-center mt-4 hidden xl:block") {{ t('userCenter.personalInfoPage.privacyNoteLine1') }}
      p(class="text-[#060C34] text-sm xl:text-base text-center hidden xl:block") {{ t('userCenter.personalInfoPage.privacyNoteLine2') }}

      div(class="fixed xl:relative bottom-0 left-0 right-0 mt-[52px]")
        button(type="button" class="w-full h-[51px] flex justify-center items-center xl:rounded-[10px] bg-[#0A1140] font-bold" @click="submit")
          p(class="w-fit text-gradient-primary") {{ t('userCenter.personalInfoPage.submit') }}
        button(type="button" class="xl:mt-2 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="router.back()") {{ t('common.back') }}
</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'
import { useAlertStore } from '~/stores/alert'
import DatePicker from 'primevue/datepicker'

const { t } = useI18n()
const userStore = useUserStore()
const alert = useAlertStore()
const router = useRouter()

const countries = ref([
  { iso2: 'KR', dialCode: '+82', labelKey: 'phoneCountry.kr', flag: '🇰🇷' },
  { iso2: 'TH', dialCode: '+66', labelKey: 'phoneCountry.th', flag: '🇹🇭' },
  { iso2: 'VN', dialCode: '+84', labelKey: 'phoneCountry.vn', flag: '🇻🇳' },
  { iso2: 'MY', dialCode: '+60', labelKey: 'phoneCountry.my', flag: '🇲🇾' },
  { iso2: 'KH', dialCode: '+855', labelKey: 'phoneCountry.kh', flag: '🇰🇭' },
  { iso2: 'CN', dialCode: '+86', labelKey: 'phoneCountry.cn', flag: '🇨🇳' },
  { iso2: 'PH', dialCode: '+63', labelKey: 'phoneCountry.ph', flag: '🇵🇭' },
  { iso2: 'ID', dialCode: '+62', labelKey: 'phoneCountry.id', flag: '🇮🇩' },
])

const nickname = ref('')
const birthday = ref(null)
const nicknameAllowedRegex = /^[A-Za-z0-9\u0021-\u007E\u4E00-\u9FFF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]+$/

onMounted(() => {
  initProfileInfo()
})

function initProfileInfo() {
  const setFromProfile = () => {
    const raw = userStore.profile?.birthday
    if (raw) {
      birthday.value = new Date(raw)
      nickname.value = userStore.profile?.nickname
      return true
    }
    return false
  }

  if (setFromProfile()) return

  const intervalId = setInterval(() => {
    if (setFromProfile()) {
      clearInterval(intervalId)
    }
  }, 300)
}

const selectedCountry = computed(() => {
  const code = userStore.profile?.mobile_code
  if (!code) return null
  return countries.value.find((c) => c.dialCode === code) || null
})

function getNicknameVisibleUnits(value) {
  let units = 0

  for (const char of value) {
    if (/[A-Za-z0-9\u0021-\u007E]/.test(char)) {
      units += 1
      continue
    }

    if (/[\u4E00-\u9FFF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/.test(char)) {
      units += 2
      continue
    }

    return -1
  }

  return units
}

async function submit() {
  const nicknameVisibleUnits = getNicknameVisibleUnits(nickname.value)

  if (!nicknameAllowedRegex.test(nickname.value) || nicknameVisibleUnits > 18) {
    alert.openError(t('userCenter.personalInfoPage.nicknameMaxLength'), { cancellable: false })
    return
  }

  try {
    const date = birthday.value
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const birthdayStr = `${y}/${m}/${d}`

    const res = await api.updatedProfile({
      nickname: nickname.value,
      birthday: birthdayStr,
    })

    if (nickname.value) {
      userStore.setProfile({
        ...userStore.profile,
        nickname: nickname.value,
      })
    }

    if (birthday.value) {
      userStore.setProfile({
        ...userStore.profile,
        birthday: birthdayStr,
      })
    }

    alert.openSuccess(t('common.profileUpdateSuccess'), { cancellable: false })
  } catch (error) {
    alert.openError(t('common.profileUpdateFailed'), { cancellable: false })
  }
}
</script>
<style scoped>
:deep(.p-inputtext) {
  border: none;
  font-size: 14px;
  padding-left: 0;
}
</style>
