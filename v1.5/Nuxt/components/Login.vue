<template lang="pug">
Teleport(to="body")
  transition(name="fade-fast")
    div(v-if="modelValue" class="fixed inset-0 z-[200]")
      div(class="absolute inset-0 bg-black/70" @click="close")
      div(class="absolute inset-0 flex items-center justify-center xl:p-4")
        div(class="relative w-full h-full xl:w-[760px] xl:h-[600px] bg-[#060C34] xl:rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-white/10 xl:border-2 border-white")
          div(class="h-full grid grid-cols-1 xl:grid-cols-[1fr_360px]")

            //- left
            div(class="relative hidden xl:block bg-[url('/images/index/login.webp?v=20260805')] bg-cover bg-center")
              div(class="absolute left-[88px] bottom-[30px]")
                NuxtImg(src="/images/index/img-logo.png" alt="logo" class="w-[200px]")

            //- right
            div(class="relative p-10 xl:pr-10 xl:py-10")
              div(class="absolute right-10 top-10 xl:right-4 xl:top-4 group")
                NuxtImg(src="/images/icon/close-white.svg" alt="close" class="w-6 h-6 cursor-pointer z-10" @click="close")

              div(class="w-full flex justify-center border-b-gradient-primary pb-4 xl:hidden" @click="close")
                NuxtImg(src="/images/index/img-logo.png" alt="logo" class="w-[150px] h-14")

              //- Mode Login
              template(v-if="mode === 'login'")
                h2(class="w-[92px] text-center xl:text-left text-gradient-primary text-[28px] font-bold tracking-wide mx-auto xl:mx-0 mt-7 xl:mt-0 mb-7 ") {{ $t('auth.login') }}
                form(@submit.prevent="onSubmit" class="h-[calc(100dvh-210px)] xl:h-auto space-y-4 overflow-y-auto overflow-x-hidden pr-[1px] pb-6 xl:pb-0 scrollbar-blue scrollbar-hidden")
                  ValidatedField(id="login-username" fieldName="Username" v-model="loginData.username" inputType="text" :placeholder="$t('auth.placeholders.username')" :label="$t('auth.labels.username')" @invalid="onFieldInvalid")
                  ValidatedField(id="login-password" fieldName="Login Password" v-model="loginData.password" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.password')" :label="$t('auth.labels.password')" @invalid="onFieldInvalid")      
                  
                  div(class="flex items-center gap-2")
                    input(id="login-remember" v-model="loginData.remember" type="checkbox" class="checkbox")
                    label(for="login-remember" class="text-white/80 text-sm") {{ $t('auth.labels.remember') }}

                  div(class="turnstile-wrap")
                    div(class="cf-turnstile" :data-sitekey="siteKey" data-theme="dark" data-callback="onTurnstileSuccess")

                  div(class="space-y-3 pt-2")
                    button(type="submit" :disabled="anyInvalidByMode || !canSubmitLogin || !turnstileToken" class="box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-transparent font-semibold hover:bg-[#E52865] hover:text-white border disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !isHover, 'border-[#E52865]': isHover }"
                      :style="{ '--bgp-stroke': '1px', '--bgp-inset': '0px' }"
                      @mouseenter="setIsHover(true)"
                      @mouseleave="setIsHover(false)"
                    ) {{ $t('auth.login') }}
                    button(type="button" class="box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-gradient-to-r from-[#DF25A6] to-[#FFB22C] hover:bg-none hover:bg-[#E52865] text-black hover:text-white font-bold" @click="mode = 'register'") {{ $t('auth.register') }}


                  div(class="pt-2 text-right")
                    button(type="button" class="text-[#E7E7E7] hover:text-white underline underline-offset-4" @click="mode = 'forgotPassword'") {{ $t('auth.forgotPassword') }}

              //- Mode Register
              template(v-if="mode === 'register'")
                h2(class="w-[150px] text-center xl:text-left text-gradient-primary text-[28px] font-bold tracking-wide mx-auto xl:mx-0 mt-7 xl:mt-0 mb-7") {{ $t('auth.register') }}
                form(@submit.prevent="onSubmit" class="h-[calc(100vh-210px)] xl:h-[448px] space-y-4 overflow-y-auto px-[1px] pb-40 xl:px-[1px] xl:pt-0 xl:pb-2 scrollbar-blue overflow-x-hidden")
                  ValidatedField(id="reg-username" fieldName="Username" v-model="registerData.username" inputType="text" :placeholder="$t('auth.placeholders.username')" :label="$t('auth.labels.username')" @invalid="onFieldInvalid")
                  ValidatedField(id="reg-password" fieldName="Login Password" v-model="registerData.password" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.password')" :label="$t('auth.labels.password')" @invalid="onFieldInvalid")
                  ValidatedField(id="reg-confirm" fieldName="Confirm Password" v-model="registerData.confirm" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.password')" :label="$t('auth.labels.confirmPassword')" @invalid="onFieldInvalid")
                  ValidatedField(id="reg-email" fieldName="Email" v-model="registerData.email" inputType="email" :placeholder="$t('auth.placeholders.email')" :label="$t('auth.labels.email')" @invalid="onFieldInvalid")
                  ValidatedField(id="reg-realname" fieldName="Real Name" v-model="registerData.real_name" inputType="text" :placeholder="$t('auth.placeholders.realName')" :label="$t('auth.labels.realName')" @invalid="onFieldInvalid")
                  div(class="w-full")
                    label(for="reg-mobile" class="block text-white/80 mb-1") {{ $t('auth.labels.mobile') }}
                    PhoneInput(
                      v-model:mobile="registerData.mobile"
                      v-model:mobileCode="registerData.mobile_code"
                      :placeholder="$t('auth.placeholders.mobile')"
                    )
                  div(class="datepicker-dark")
                    label(for="reg-birthday" class="block text-white/80 mb-1") {{ $t('auth.labels.birthday') }}
                    DatePicker(
                      id="reg-birthday"
                      v-model="registerData.birthday"
                      v-model:viewDate="registerBirthdayViewDate"
                      :maxDate="registerBirthdayMaxDate"
                      dateFormat="yy/mm/dd"
                      appendTo="body"
                      :placeholder="$t('auth.placeholders.birthday')"
                      class="w-full"
                      inputClass="w-full h-[30px] px-3 rounded-md bg-[#1F1F1F] text-white text-sm placeholder-[#6D6D6D] border border-white/10 focus:outline-none focus:border-2 focus:border-[#00D0FF]"
                    )
                  ValidatedField(
                    id="reg-invite"
                    fieldName="Invitation Code"
                    v-model="registerData.invitation_code"
                    inputType="text"
                    :placeholder="$t('auth.placeholders.invitation')"
                    :label="$t('auth.labels.invitation')"
                    :disabled="globalUiStore.keepPartnerCode"
                    @invalid="onFieldInvalid"
                  )

                  div(class="turnstile-wrap")
                    div(class="cf-turnstile" :data-sitekey="siteKey" data-theme="dark" data-callback="onTurnstileSuccess")

                  div(class="flex items-center gap-2")
                    input(id="register-agree" v-model="registerData.agreeTerms" type="checkbox" class="checkbox")
                    label(for="register-agree" class="text-white/80 text-sm") {{ $t('auth.labels.agreeTerms') }}

                  div(class="space-y-3 pt-2")
                    button(type="submit" :disabled="anyInvalidByMode || !canSubmitRegister || !registerData.agreeTerms || !turnstileToken" class="login-submit-button box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-transparent font-semibold hover:bg-[#E52865] hover:text-white border disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !isHover, 'border-[#E52865]': isHover }"
                      :style="{ '--bgp-stroke': '1px', '--bgp-inset': '0px' }"
                      @mouseenter="setIsHover(true)"
                      @mouseleave="setIsHover(false)"
                    ) {{ $t('auth.submit') }}
                    button(type="button" class="box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-gradient-to-r from-[#DF25A6] to-[#FFB22C] hover:bg-none hover:bg-[#E52865] text-black hover:text-white font-bold" @click="mode = 'login'") {{ $t('auth.login') }}

              //- Mode Forget Password
              template(v-else-if="mode === 'forgotPassword'")
                h2(class="w-[300px] text-center text-gradient-primary text-xl xl:text-2xl xl:text-left font-bold tracking-wide mx-auto xl:mx-0 mt-7 xl:mt-0 mb-7") {{ $t('auth.forgotPassword') }}
                form(@submit.prevent="onSubmit" class="h-[calc(100dvh-210px)] xl:h-auto space-y-4 overflow-y-auto overflow-x-hidden pr-[1px] pb-6 xl:pb-0 scrollbar-blue scrollbar-hidden")
                  ValidatedField(id="fp-username" fieldName="Username" v-model="forgetPassword.username" inputType="text" :placeholder="$t('auth.placeholders.username')" :label="$t('auth.labels.username')" @invalid="onFieldInvalid")
                  ValidatedField(id="fp-email" fieldName="Email" v-model="forgetPassword.email" inputType="email" :placeholder="$t('auth.placeholders.email')" :label="$t('auth.labels.email')" @invalid="onFieldInvalid")

                  div(class="turnstile-wrap")
                    div(class="cf-turnstile" :data-sitekey="siteKey" data-theme="dark" data-callback="onTurnstileSuccess")
                    
                  div(class="space-y-3 pt-2")
                    button(type="submit" :disabled="anyInvalidByMode || !canSubmitForgot || !turnstileToken" class="login-submit-button box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-transparent font-semibold hover:bg-[#E52865] hover:text-white border disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !isHover, 'border-[#E52865]': isHover }"
                      :style="{ '--bgp-stroke': '1px', '--bgp-inset': '0px' }"
                      @mouseenter="setIsHover(true)"
                      @mouseleave="setIsHover(false)"
                    ) {{ $t('auth.submit') }}
                
              //- Mode Forget Password Success
              template(v-else-if="mode === 'forgetPasswordSuccess'")
                h2(class="w-[300px] text-gradient-primary text-[28px] font-bold tracking-wide mx-auto xl:mx-0 mt-7 xl:mt-0 mb-7") {{ $t('auth.forgotPassword') }}
                p(class="text-white/80 mb-7") {{ $t('auth.forgotPasswordSuccess') }}

                div(class="space-y-3 pt-2")
                  button(type="submit" class="w-full h-10 flex items-center justify-center rounded-[10px] bg-transparent font-semibold hover:bg-[#E52865] hover:text-white border"
                    :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !isHover, 'border-[#E52865]': isHover }"
                    @mouseenter="setIsHover(true)"
                    @mouseleave="setIsHover(false)"
                    @click="close"
                  ) {{ $t('auth.done') }}

              //- Mode Change Password
              template(v-if="mode === 'changePassword'")
                h2(class="w-[305px] text-gradient-primary text-[28px] font-bold tracking-wide mx-auto xl:mx-0 mt-7 xl:mt-0 mb-7") {{ $t('auth.changePassword') }}
                form(@submit.prevent="onSubmit" class="h-[calc(100dvh-210px)] xl:h-auto space-y-4 overflow-y-auto overflow-x-hidden pr-[1px] pb-6 xl:pb-0 scrollbar-blue scrollbar-hidden")
                  ValidatedField(id="cp-oldpassword" fieldName="Old Password" v-model="changePassword.oldPassword" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.oldPassword')" :label="$t('auth.labels.oldPassword')" @invalid="onFieldInvalid")
                  ValidatedField(id="cp-password" fieldName="New Password" v-model="changePassword.newPassword" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.newPassword')" :label="$t('auth.labels.newPassword')" @invalid="onFieldInvalid")
                  ValidatedField(id="cp-confirm" fieldName="Confirm Password" v-model="changePassword.confirmNewPassword" inputType="password" :toggleable="true" :placeholder="$t('auth.placeholders.newPassword')" :label="$t('auth.labels.confirmNewPassword')" @invalid="onFieldInvalid")

                  div(class="turnstile-wrap")
                    div(class="cf-turnstile" :data-sitekey="siteKey" data-theme="dark" data-callback="onTurnstileSuccess")

                  div(class="space-y-3 pt-2")
                    button(type="submit" :disabled="anyInvalidByMode || !canSubmitChangePassword || !turnstileToken" class="box-border w-full h-10 flex items-center justify-center rounded-[10px] bg-transparent font-semibold hover:bg-[#E52865] hover:text-white border disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="{ 'text-gradient-primary border-transparent border-gradient-primary-mask': !isHover, 'border-[#E52865]': isHover }"
                      :style="{ '--bgp-stroke': '1px', '--bgp-inset': '0px' }"
                      @mouseenter="setIsHover(true)"
                      @mouseleave="setIsHover(false)"
                    ) {{ $t('auth.submit') }}
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialMode: { type: String, default: 'login' },
})

import { ref, watch, computed, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { api } from '~/composables/useApi'
import { useAlertStore } from '~/stores/alert'
import { useUserStore } from '~/stores/user'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useI18n } from 'vue-i18n'
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import DatePicker from 'primevue/datepicker'
import { getCurrentLanguage } from '~/composables/useLanguage'

const emit = defineEmits(['update:modelValue', 'submit', 'register', 'promotion', 'forgot'])
const mode = ref(props.initialMode)

watch(
  () => props.modelValue,
  (val) => {
    if (val) mode.value = props.initialMode || 'login'
  },
)
const alert = useAlertStore()
const userStore = useUserStore()
const globalUiStore = useGlobalUiStore()
const { t } = useI18n()
const config = useRuntimeConfig()

const canSubmitLogin = computed(() => {
  const l = loginData.value
  return !!(l.username && l.password)
})

const canSubmitRegister = computed(() => {
  const r = registerData.value
  return (
    !!r.username &&
    !!r.password &&
    !!r.confirm &&
    r.password === r.confirm &&
    !!r.email &&
    !!r.real_name &&
    !!r.mobile &&
    !!r.birthday
  )
})

const canSubmitChangePassword = computed(() => {
  const c = changePassword.value
  return !!(c.oldPassword && c.newPassword && c.confirmNewPassword)
})

const canSubmitForgot = computed(() => {
  return !!(forgetPassword.value.username && forgetPassword.value.email && turnstileToken.value)
})

watch(
  () => mode.value,
  async (v) => {
    invalidMap.value = {}
    isHover.value = false
    if (v === 'forgotPassword') {
      forgetPassword.value = { username: '', email: '' }
    }

    await refreshTurnstile()
  },
)

const invalidMap = ref({})
function onFieldInvalid(e) {
  if (!e || !e.fieldName) return
  invalidMap.value = { ...invalidMap.value, [e.fieldName]: !!e.invalid }
}
const anyInvalidByMode = computed(() => {
  const map = invalidMap.value

  switch (mode.value) {
    case 'login':
      return !!(map['Username'] || map['Login Password'])

    case 'register':
      return !!(
        map['Username'] ||
        map['Login Password'] ||
        map['Confirm Password'] ||
        map['Email'] ||
        map['Real Name'] ||
        map['Invitation Code'] ||
        map['Mobile'] ||
        map['Birthday']
      )

    case 'forgotPassword':
      return !!(map['Username'] || map['Email'])

    case 'forgetPasswordSuccess':
    case 'changePassword':
      return !!(map['Old Password'] || map['New Password'] || map['Confirm Password'])
    default:
      return false
  }
})
const loginData = ref({
  username: '',
  password: '',
  remember: false,
  showPassword: false,
})

onMounted(async () => {
  const remembered = localStorage.getItem('remember') === '1'
  const savedUser = localStorage.getItem('username') || ''
  if (remembered) {
    loginData.value.remember = true
    if (!loginData.value.username) loginData.value.username = savedUser
  }
  await nextTick()
  ensureTurnstile()
  checkPartnerCode()
})

watch(
  () => loginData.value.remember,
  (val) => {
    localStorage.setItem('remember', val ? '1' : '0')
    if (val) {
      const u = loginData.value.username || ''
      if (u) localStorage.setItem('username', u)
    } else {
      localStorage.removeItem('username')
    }
  },
)

watch(
  () => loginData.value.username,
  (val) => {
    if (loginData.value.remember) localStorage.setItem('username', val || '')
  },
)

function getDefaultRegisterData() {
  return {
    username: '',
    password: '',
    confirm: '',
    email: '',
    real_name: '',
    mobile: '',
    mobile_code: '82',
    birthday: '',
    invitation_code: '',
    agreeTerms: false,
    showPassword: false,
  }
}

const registerData = ref(getDefaultRegisterData())

function dateYearsAgo(years) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}

const registerBirthdayMaxDate = ref(dateYearsAgo(18))
const registerBirthdayViewDate = ref(registerBirthdayMaxDate.value)

watch(
  () => registerData.value.birthday,
  (v) => {
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      registerBirthdayViewDate.value = v
      return
    }
    if (v) {
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) {
        registerBirthdayViewDate.value = d
        return
      }
    }
    registerBirthdayViewDate.value = registerBirthdayMaxDate.value
  },
  { immediate: true },
)

const forgetPassword = ref({
  username: '',
  email: '',
})

const changePassword = ref({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  showPassword: false,
  showConfirm: false,
})

const isHover = ref(false)
const captchaText = ref('7172')
const siteKey = ref(config.public.turnstileSiteKey)
const turnstileToken = ref('')
const turnstileRendered = ref(false)
const turnstileWidgetId = ref(null)

let savedScrollY = 0
let turnstileResizeObserver

let turnstileReadyPromise
function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (!turnstileReadyPromise) {
    turnstileReadyPromise = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      document.head.appendChild(s)
    })
  }
  return turnstileReadyPromise
}

function renderTurnstileOnce() {
  if (turnstileRendered.value || !window.turnstile) return
  const el = document.querySelector('.cf-turnstile')
  if (!el) return
  el.innerHTML = ''
  turnstileWidgetId.value = window.turnstile.render(el, {
    sitekey: siteKey.value,
    theme: 'dark',
    callback: (t) => {
      turnstileToken.value = t
    },
  })
  turnstileRendered.value = true
}

function updateTurnstileScale() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.turnstile-wrap').forEach((wrap) => {
    const width = wrap.clientWidth || 300
    const shouldFillWidth = window.innerWidth <= 450
    const scale = shouldFillWidth ? width / 300 : Math.min(1, width / 300)
    wrap.style.setProperty('--turnstile-scale', String(scale))
  })
}

function observeTurnstileSize() {
  if (typeof document === 'undefined' || typeof ResizeObserver === 'undefined') return
  if (turnstileResizeObserver) turnstileResizeObserver.disconnect()
  turnstileResizeObserver = new ResizeObserver(updateTurnstileScale)
  document.querySelectorAll('.turnstile-wrap').forEach((wrap) => {
    turnstileResizeObserver.observe(wrap)
  })
  updateTurnstileScale()
}

async function ensureTurnstile() {
  await loadTurnstileScript()
  observeTurnstileSize()
  renderTurnstileOnce()
}

function resetTurnstile() {
  turnstileToken.value = ''
  if (typeof window === 'undefined' || !window.turnstile) return
  try {
    if (
      typeof window.turnstile.remove === 'function' &&
      turnstileWidgetId.value !== null &&
      turnstileWidgetId.value !== undefined
    ) {
      window.turnstile.remove(turnstileWidgetId.value)
      turnstileWidgetId.value = null
    }
    if (turnstileWidgetId.value !== null && turnstileWidgetId.value !== undefined) {
      window.turnstile.reset(turnstileWidgetId.value)
    } else {
      window.turnstile.reset()
    }
  } catch (e) {
    const msg = String(e?.message || e)
    if (!/nothing to reset/i.test(msg)) {
      console.warn('Turnstile reset skipped:', e)
    }
  }
}

async function refreshTurnstile() {
  resetTurnstile()
  turnstileRendered.value = false
  turnstileWidgetId.value = null
  if (typeof document !== 'undefined') {
    const el = document.querySelector('.cf-turnstile')
    if (el) el.innerHTML = ''
  }
  await nextTick()
  await ensureTurnstile()
}

function checkPartnerCode() {
  if (globalUiStore.keepPartnerCode) {
    registerData.value.invitation_code = globalUiStore.keepPartnerCode
  }
}

function setIsHover(value) {
  isHover.value = value
}

function close() {
  mode.value = 'login'
  emit('update:modelValue', false)
}

function togglePassword() {
  loginData.value.showPassword = !loginData.value.showPassword
}

let submitThrottleTimer
let submitThrottling = false

function onSubmit() {
  if (submitThrottling) return
  submitThrottling = true
  onSubmitImpl()
  if (submitThrottleTimer) clearTimeout(submitThrottleTimer)
  submitThrottleTimer = setTimeout(() => {
    submitThrottling = false
  }, 2000)
}

async function onSubmitImpl() {
  if (mode.value === 'login') {
    if (anyInvalidByMode.value) return
    if (!loginData.value.username || !loginData.value.password) {
      alert.openError(t('auth.fillAllFields'), { cancellable: false })
      return
    }

    try {
      const res = await api.login({
        username: loginData.value.username,
        password: loginData.value.password,
        'cf-turnstile-response': turnstileToken.value,
      })
      const token = res?.data?.token || ''
      const refreshToken = res?.data?.refreshToken || ''
      const expires = Number(res?.data?.expires) || 0
      const now = Math.floor(Date.now() / 1000)
      const maxAge = Math.max(0, (expires || now + 60 * 60) - now)

      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

      const tokenCookie = useCookie('token', {
        path: '/',
        maxAge,
        sameSite: 'lax',
        secure: isHttps,
      })
      const refreshCookie = useCookie('refreshToken', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: isHttps,
      })

      tokenCookie.value = token
      refreshCookie.value = refreshToken

      const config = useRuntimeConfig()
      const lang = getCurrentLanguage()

      const { data } = await api.getProfile(undefined, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': config.public.tenantId,
          'X-Brand-ID': config.public.brandId,
          'X-Language': lang,
          Authorization: `Bearer ${token}`,
        },
      })
      userStore.setProfile(data)

      if (res.data.passwordExpired) {
        mode.value = 'changePassword'
        navigateTo('/')
        emit('update:modelValue', true)
        return
      }

      loginData.value.password = ''

      alert.openSuccess(t('auth.loginSuccess'))
      emit('update:modelValue', false)
      navigateTo('/')
    } catch (error) {
      const msg = error?.statusMessage || error?.message || 'Request failed'
      alert.openError(msg, { cancellable: false })
    } finally {
      await refreshTurnstile()
    }
    return
  }

  if (mode.value === 'register') {
    if (anyInvalidByMode.value) return
    if (!canSubmitRegister.value) return
    if (!registerData.value.agreeTerms) {
      alert.openError(t('auth.agreeTerms'), { cancellable: false })
      return
    }

    try {
      const code = String(registerData.value.mobile_code || '').replace(/[^0-9]/g, '')
      const number = String(registerData.value.mobile || '')
      const mobileVal = code && number ? `+${code}${number}` : ''
      const phone = parsePhoneNumberFromString(mobileVal)
      if (!phone || !phone.isValid()) {
        alert.openError(t('auth.invalidMobile'), { cancellable: false })
        return
      }
    } catch (e) {
      alert.openError(t('auth.invalidMobile'), { cancellable: false })
      return
    }

    try {
      registerData.value.mobile_code =
        '+' + String(registerData.value.mobile_code).replace(/^\+/, '')

      const rawBirthday = registerData.value.birthday
      let birthday = ''
      if (rawBirthday instanceof Date) {
        // DatePicker 回傳 Date，用 ISO 字串再切成 yyyy-mm-dd
        birthday = rawBirthday.toISOString().slice(0, 10)
      } else if (rawBirthday) {
        const s = String(rawBirthday)
        birthday = s.length >= 10 ? s.slice(0, 10) : s
      }

      const res = await api.register({
        ...registerData.value,
        birthday,
        'cf-turnstile-response': turnstileToken.value,
      })
      mode.value = 'login'
      alert.openSuccess(t('auth.registerSuccess'))
      registerData.value = getDefaultRegisterData()
    } catch (e) {
      alert.openError(e?.message || t('auth.registerFailed'), { cancellable: false })
    } finally {
      await refreshTurnstile()
    }
  }

  if (mode.value === 'forgotPassword') {
    if (!forgetPassword.value.username || !forgetPassword.value.email) {
      alert.openError(t('auth.fillAllFields'), { cancellable: false })
      return
    }

    if (!turnstileToken.value) {
      alert.openError(t('auth.completeCaptcha'), { cancellable: false })
      return
    }

    try {
      const res = await api.forgotPassword({
        ...forgetPassword.value,
        'cf-turnstile-response': turnstileToken.value,
      })

      mode.value = 'forgetPasswordSuccess'
    } catch (e) {
      alert.openError(e?.message || t('auth.forgotPasswordFailed'), { cancellable: false })
    } finally {
      await refreshTurnstile()
    }
  }

  if (mode.value === 'changePassword') {
    if (
      !changePassword.value.oldPassword ||
      !changePassword.value.newPassword ||
      !changePassword.value.confirmNewPassword
    ) {
      alert.openError(t('auth.fillAllFields'), { cancellable: false })
      return
    }

    if (changePassword.value.newPassword !== changePassword.value.confirmNewPassword) {
      alert.openError(t('auth.passwordNotMatch'), { cancellable: false })
      return
    }

    if (!turnstileToken.value) {
      alert.openError(t('auth.completeCaptcha'), { cancellable: false })
      return
    }

    try {
      const res = await api.changePassword({
        old_password: changePassword.value.oldPassword,
        new_password: changePassword.value.newPassword,
        'cf-turnstile-response': turnstileToken.value,
      })

      alert.openSuccess(t('auth.changePasswordSuccess'))
      emit('update:modelValue', false)

      mode.value = 'login'
    } catch (e) {
      alert.openError(e?.message || t('auth.changePasswordFailed'), { cancellable: false })
    } finally {
      await refreshTurnstile()
    }
  }
}

watch(
  () => props.modelValue,
  (v) => {
    const html = document.documentElement
    const body = document.body
    if (v) {
      turnstileRendered.value = false
      if (typeof window !== 'undefined') {
        savedScrollY = window.scrollY || 0
      }
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${savedScrollY}px`
      body.style.width = '100%'
    } else {
      html.style.overflow = ''
      body.style.overflow = ''
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      if (typeof window !== 'undefined') {
        window.scrollTo(0, savedScrollY)
      }
    }
  },
)

onBeforeUnmount(() => {
  const html = document.documentElement
  const body = document.body
  html.style.overflow = ''
  body.style.overflow = ''
  body.style.position = ''
  body.style.top = ''
  body.style.width = ''
  if (typeof window !== 'undefined') {
    window.scrollTo(0, savedScrollY)
  }

  if (submitThrottleTimer) clearTimeout(submitThrottleTimer)
  if (turnstileResizeObserver) turnstileResizeObserver.disconnect()
})
watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    await nextTick()
    await refreshTurnstile()
  },
)
</script>

<style scoped>
:deep(input:not([type='checkbox']):focus),
.datepicker-dark :deep(.p-inputtext:focus) {
  border-color: transparent !important;
  border-width: 2px !important;
  background:
    linear-gradient(#1f1f1f, #1f1f1f) padding-box,
    linear-gradient(90deg, var(--linear-gradient-pink), var(--linear-gradient-orange)) border-box !important;
  box-shadow: none !important;
}

.datepicker-dark :deep(.p-inputtext) {
  background-color: #1f1f1f !important;
  color: #ffffff !important;
  height: 30px;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: none;
}

.datepicker-dark :deep(.p-inputtext::placeholder) {
  color: #6d6d6d;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 150ms ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

.checkbox {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background-color: transparent;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
  display: inline-block;
  cursor: pointer;
}
.checkbox:hover {
  background-color: rgba(255, 255, 255, 0.25);
}
.checkbox:checked {
  background-color: #0a1140;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white"><path d="M7.5 13.3L4.2 10l-1.2 1.2 4.5 4.5L17 6.2l-1.2-1.2z"/></svg>');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 12px;
}

:deep(.vue-tel-input) {
  width: 100%;
  height: 30px;
  background-color: #1f1f1f;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:deep(.vue-tel-input .vti__input) {
  height: 30px;
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.875rem;
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.vue-tel-input .vti__dropdown) {
  background-color: transparent;
  border: none;
  color: #ffffff;
}

:deep(.vue-tel-input input::placeholder) {
  color: #6d6d6d;
}

:deep(.vue-tel-input.vue-tel-input--is-focused) {
  border-width: 2px;
  border-color: #00d0ff;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  background-color: #0a1140;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  color: #ffffff;
}

:deep(.vue-tel-input .vti__dropdown-item) {
  background-color: transparent;
  color: #ffffff;
  font-size: 0.875rem;
}

:deep(.vue-tel-input .vti__dropdown-item--highlighted),
:deep(.vue-tel-input .vti__dropdown-item:hover) {
  background-color: rgba(0, 208, 255, 0.18);
}

:deep(.scrollbar-blue) {
  scrollbar-color: #F3AC2F transparent;
  scrollbar-width: thin;
}
:deep(.scrollbar-blue::-webkit-scrollbar) {
  width: 8px;
}
:deep(.scrollbar-blue::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.scrollbar-blue::-webkit-scrollbar-thumb) {
  background-color: #F3AC2F;
  border-radius: 9999px;
}

.turnstile-wrap {
  --turnstile-native-width: 300px;
  --turnstile-scale: 1;
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: calc(74px * var(--turnstile-scale));
  overflow: visible;
}

.turnstile-wrap :deep(.cf-turnstile) {
  width: var(--turnstile-native-width);
  min-width: var(--turnstile-native-width);
  height: 65px;
  overflow: visible;
}

.turnstile-wrap :deep(.cf-turnstile) {
  transform: scale(var(--turnstile-scale));
  transform-origin: top center;
}

@media (min-width: 1281px) {
  .turnstile-wrap {
    --turnstile-scale: 0.925;
  }

  .turnstile-wrap :deep(.cf-turnstile) {
    transform-origin: top center;
  }
}
</style>
