<template lang="pug">
div(class="h-[calc(100vh-32px)] xl:h-[calc(100vh-123px)] bg-white")
  h1(class="text-[#060C34] text-[32px] font-bold xl:pt-4 pb-2 px-8 border-b border-[#E7E7E7] hidden xl:block xl:ml-[260px]")
    | {{ $route.query.type === 'lgps' ? t('userCenter.changePassword.changeLogin') : t('userCenter.changePassword.changeTransaction') }}
  section(class="px-4 xl:px-8 pb-20 xl:pb-10 pt-4 xl:pt-6 xl:ml-[260px]")
    div(class="relative h-[calc(100vh-284px)] max-w-[945px] mx-auto")
      div(class="space-y-4 mt-6")
        div(v-show="userStore.profile?.fund_password_set" class="relative")
          input(
            v-model.trim="currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            :placeholder="t('userCenter.changePassword.currentPlaceholder') || 'Please enter current password'"
            class="w-full h-12 rounded-lg border px-4 pr-10 text-[#0A1140] placeholder-[#BDBDBD] focus:outline-none"
            :class="currentError ? 'border-[#E11D48]' : 'border-[#0A1140]'"
          )
          button(type="button" class="absolute right-3 top-3 w-6 h-6 inline-flex items-center justify-center" @click="showCurrent = !showCurrent")
            svg(v-if="!showCurrent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7s10-7 10-7s-3-7-10-7m0 12a5 5 0 1 1 0-10a5 5 0 0 1 0 10m0-2a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z")
            svg(v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M2 5.27L3.28 4L20 20.72L18.73 22l-2.05-2.05q-2.64.8-4.68.05T8 18.75q-3.7-2.1-6-6.75q1.1-2.2 2.62-3.87ZM12 7a5 5 0 0 1 5 5a4.87 4.87 0 0 1-.33 1.75l-1.49-1.49A3 3 0 0 0 9.74 9.34L8.3 7.9A5.22 5.22 0 0 1 12 7m0 10q.85 0 1.71-.22l-1.58-1.58A3 3 0 0 1 9 12q0-.45.1-.87l-2-2A10.7 10.7 0 0 0 4 12q1.9 3.55 4.89 4.73A7.1 7.1 0 0 0 12 17" )

          p(v-if="currentError" class="mt-1 text-xs text-[#E11D48]") {{ currentError }}

        div(v-if="route.query.type === 'lgps'" class="relative")
          input(
            v-model.trim="newPassword"
            :type="showNew ? 'text' : 'password'"
            :placeholder="t('userCenter.changePassword.newPlaceholder') || 'Please enter a new password'"
            class="w-full h-12 rounded-lg border px-4 pr-10 text-[#060C34] placeholder-[#BDBDBD] focus:outline-none"
            :class="newError ? 'border-[#E11D48]' : 'border-[#B0B0B0]'"
          )
          button(type="button" class="absolute right-3 top-3 w-6 h-6 inline-flex items-center justify-center" @click="showNew = !showNew")
            svg(v-if="!showNew" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7s10-7 10-7s-3-7-10-7m0 12a5 5 0 1 1 0-10a5 5 0 0 1 0 10m0-2a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z")
            svg(v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M2 5.27L3.28 4L20 20.72L18.73 22l-2.05-2.05q-2.64.8-4.68.05T8 18.75q-3.7-2.1-6-6.75q1.1-2.2 2.62-3.87ZM12 7a5 5 0 0 1 5 5a4.87 4.87 0 0 1-.33 1.75l-1.49-1.49A3 3 0 0 0 9.74 9.34L8.3 7.9A5.22 5.22 0 0 1 12 7m0 10q.85 0 1.71-.22l-1.58-1.58A3 3 0 0 1 9 12q0-.45.1-.87l-2-2A10.7 10.7 0 0 0 4 12q1.9 3.55 4.89 4.73A7.1 7.1 0 0 0 12 17" )

          p(v-if="newError" class="mt-1 text-xs text-[#E11D48]") {{ newError }}

        div(v-else class="relative")
          input(
            v-model.trim="newPassword"
            :type="showNew ? 'text' : 'password'"
            :placeholder="t('userCenter.changePassword.newPlaceholder') || 'Please enter a new password'"
            class="w-full h-12 rounded-lg border px-4 pr-10 text-[#060C34] placeholder-[#BDBDBD] focus:outline-none"
            :class="newError ? 'border-[#E11D48]' : 'border-[#B0B0B0]'"
          )
          button(type="button" class="absolute right-3 top-3 w-6 h-6 inline-flex items-center justify-center" @click="showNew = !showNew")
            svg(v-if="!showNew" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7s10-7 10-7s-3-7-10-7m0 12a5 5 0 1 1 0-10a5 5 0 0 1 0 10m0-2a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z")
            svg(v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M2 5.27L3.28 4L20 20.72L18.73 22l-2.05-2.05q-2.64.8-4.68.05T8 18.75q-3.7-2.1-6-6.75q1.1-2.2 2.62-3.87ZM12 7a5 5 0 0 1 5 5a4.87 4.87 0 0 1-.33 1.75l-1.49-1.49A3 3 0 0 0 9.74 9.34L8.3 7.9A5.22 5.22 0 0 1 12 7m0 10q.85 0 1.71-.22l-1.58-1.58A3 3 0 0 1 9 12q0-.45.1-.87l-2-2A10.7 10.7 0 0 0 4 12q1.9 3.55 4.89 4.73A7.1 7.1 0 0 0 12 17" )

          p(v-if="newError" class="mt-1 text-xs text-[#E11D48]") {{ newError }}

        div(class="relative")
          input(
            v-model.trim="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            :placeholder="t('userCenter.changePassword.confirmPlaceholder') || 'Confirm new password'"
            class="w-full h-12 rounded-lg border px-4 pr-10 text-[#060C34] placeholder-[#BDBDBD] focus:outline-none"
            :class="confirmError ? 'border-[#E11D48]' : 'border-[#B0B0B0]'"
          )
          button(type="button" class="absolute right-3 top-3 w-6 h-6 inline-flex items-center justify-center" @click="showConfirm = !showConfirm")
            svg(v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7s10-7 10-7s-3-7-10-7m0 12a5 5 0 1 1 0-10a5 5 0 0 1 0 10m0-2a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z")
            svg(v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-[#0A1140]")
              path(fill="currentColor" d="M2 5.27L3.28 4L20 20.72L18.73 22l-2.05-2.05q-2.64.8-4.68.05T8 18.75q-3.7-2.1-6-6.75q1.1-2.2 2.62-3.87ZM12 7a5 5 0 0 1 5 5a4.87 4.87 0 0 1-.33 1.75l-1.49-1.49A3 3 0 0 0 9.74 9.34L8.3 7.9A5.22 5.22 0 0 1 12 7m0 10q.85 0 1.71-.22l-1.58-1.58A3 3 0 0 1 9 12q0-.45.1-.87l-2-2A10.7 10.7 0 0 0 4 12q1.9 3.55 4.89 4.73A7.1 7.1 0 0 0 12 17" )

          p(v-if="confirmError" class="mt-1 text-xs text-[#E11D48]") {{ confirmError }}

      div(class="mt-4 flex items-center gap-2 text-[#0A1140]")
        svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 shrink-0")
          path(fill="currentColor" d="M12 2l2.39 4.84L20 8l-4 3.9L17 18l-5-2.62L7 18l1-6.1L4 8l5.61-1.16z")
        p(class="text-xs xl:text-sm") {{ $route.query.type === 'lgps' ? t('userCenter.changePassword.ruleHintLogin') : t('userCenter.changePassword.ruleHint') }}

      div(class="fixed xl:absolute bottom-0 left-0 right-0 mt-[52px]")
        button(
          type="button"
          class="w-full h-[51px] flex justify-center items-center xl:rounded-[10px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[#0A1140]"
          :disabled="isDisabled"
          @click="submit"
        )
          p(class="w-fit text-gradient-primary") {{ t('userCenter.personalInfoPage.submit') }}
        button(type="button" class="xl:mt-2 w-full h-12 xl:border border-[#060C34] text-[#060C34] text-[14px] font-bold xl:rounded-md bg-white" @click="navigateTo('/usercenter/securitycenter')") {{ t('common.back') }}
</template>

<script setup>
definePageMeta({ layout: 'usercenter' })

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlertStore } from '~/stores/alert'
import { useApiRulesStore } from '~/stores/apiRules'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const route = useRoute()
const alert = useAlertStore()
const apiRulesStore = useApiRulesStore()
const userStore = useUserStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const currentError = ref('')
const newError = ref('')
const confirmError = ref('')

function validateConfirmPassword(val) {
  confirmError.value = ''
  if (!val) return

  const len = val.length
  if (len < 6 || len > 16) {
    confirmError.value = t('userCenter.changePassword.lengthInvalid')
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(val)) {
    confirmError.value = t('userCenter.changePassword.patternInvalidLogin')
    return
  }

  if (newPassword.value && val !== newPassword.value) {
    confirmError.value = t('userCenter.changePassword.confirmInvalid')
  }
}

const isDisabled = computed(() => {
  const isTsps = route.query.type === 'tsps'
  const isLgps = route.query.type === 'lgps'

  const hasErrors = Boolean(currentError.value || newError.value || confirmError.value)

  if (isTsps) {
    const missingRequired = !newPassword.value || !confirmPassword.value
    return missingRequired || hasErrors
  }

  if (isLgps) {
    const needCurrent = Boolean(userStore.profile?.fund_password_set)
    const missingRequired =
      (needCurrent && !currentPassword.value) || !newPassword.value || !confirmPassword.value

    return missingRequired || hasErrors
  }

  return true
})

// Realtime field-level validation
watch(currentPassword, (val) => {
  currentError.value = ''
  if (!val) return

  const len = val.length
  if (len < 6 || len > 16) {
    currentError.value = t('userCenter.changePassword.lengthInvalid')
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(val)) {
    currentError.value = t('userCenter.changePassword.patternInvalidLogin')
  }
})

watch(newPassword, (val) => {
  newError.value = ''
  if (!val) return

  const len = val.length
  if (len < 6 || len > 16) {
    newError.value = t('userCenter.changePassword.lengthInvalid')
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(val)) {
    newError.value = t('userCenter.changePassword.patternInvalidLogin')
  }

  if (confirmPassword.value) {
    validateConfirmPassword(confirmPassword.value)
  }
})

watch(confirmPassword, (val) => {
  validateConfirmPassword(val)
})

async function submit() {
  const currentLen = currentPassword.value.length
  const newLen = newPassword.value.length
  const confirmLen = confirmPassword.value.length

  if (currentPassword.value) {
    if (currentLen < 6 || currentLen > 16) {
      alert.openError(t('userCenter.changePassword.lengthInvalid'), { cancellable: false })
      return
    }

    if (!/^[a-zA-Z0-9]+$/.test(currentPassword.value)) {
      alert.openError(t('userCenter.changePassword.patternInvalidLogin'), { cancellable: false })
      return
    }
  }

  const newPatternInvalid = !/^[a-zA-Z0-9]+$/.test(newPassword.value)
  const confirmPatternInvalid = !/^[a-zA-Z0-9]+$/.test(confirmPassword.value)

  if (newLen < 6 || newLen > 16 || confirmLen < 6 || confirmLen > 16) {
    alert.openError(t('userCenter.changePassword.lengthInvalid'), { cancellable: false })
    return
  }

  if (newPatternInvalid || confirmPatternInvalid) {
    alert.openError(t('userCenter.changePassword.patternInvalidLogin'), { cancellable: false })
    return
  }

  // 驗證新密碼是否符合格式規則
  if (newPassword.value !== confirmPassword.value) {
    alert.openError(t('userCenter.changePassword.confirmInvalid'), { cancellable: false })
    return
  }

  if (route.query.type === 'lgps') {
    try {
      const res = await api.changePassword({
        old_password: currentPassword.value,
        new_password: newPassword.value,
      })
      alert.openSuccess(t('userCenter.changePassword.success'), { redirectUrl: '/usercenter' })
    } catch (error) {
      alert.openError(error.message, { cancellable: false })
    }
  } else {
    try {
      const res = await api.changeFundPassword({
        old_password: currentPassword.value,
        new_password: newPassword.value,
      })
      alert.openSuccess(t('userCenter.changePassword.success'), { redirectUrl: '/usercenter' })
    } catch (error) {
      alert.openError(error.message, { cancellable: false })
    }
  }
  const { initProfile } = useAuthInitProfile()
  await initProfile({ redirectIfMissingAuth: false })
}
</script>
