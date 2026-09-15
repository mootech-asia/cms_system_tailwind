<template lang="pug">
Navbar
keep-alive
	NuxtPage
Footer
BottomNavbar
SideBar
AlertModal
</template>
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApiRulesStore } from '~/stores/apiRules'
import { useGlobalUiStore } from '~/stores/globalUi'
import { useUserStore } from '~/stores/user'
import { patterns } from '~/utils/patterns'
import { useAuthInitProfile } from '~/composables/useAuthInitProfile'

const apiRulesStore = useApiRulesStore()
const globalUiStore = useGlobalUiStore()
const userStore = useUserStore()

const route = useRoute()
const { locale } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
}))

let profileIntervalId = null

const apiPatterns = ref([
  {
    field_name: 'Username',
    enabled: true,
    editable: false,
    registerable: true,
    required: true,
    pattern_id: 1,
    min: 6,
    max: 13,
  },
  {
    field_name: 'Login Password',
    enabled: true,
    editable: false,
    registerable: true,
    required: true,
    pattern_id: 1,
    min: 6,
    max: 16,
  },
  {
    field_name: 'New Password',
    enabled: true,
    editable: false,
    registerable: false,
    required: true,
    pattern_id: 1,
    min: 6,
    max: 16,
  },
  {
    field_name: 'Confirm Password',
    enabled: true,
    editable: false,
    registerable: false,
    required: true,
    pattern_id: 1,
    min: 6,
    max: 16,
  },
  {
    field_name: 'Payment Password',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Nickname',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Real Name',
    enabled: true,
    editable: false,
    registerable: true,
    required: true,
    pattern_id: 24,
    min: 2,
    max: 30,
  },
  {
    field_name: 'ID Number',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 3,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Mobile No.',
    enabled: true,
    editable: false,
    registerable: true,
    required: true,
    pattern_id: 6,
    min: 10,
    max: 20,
  },
  {
    field_name: 'Invitation code',
    enabled: true,
    editable: false,
    registerable: true,
    required: false,
    pattern_id: 1,
    min: 10,
    max: 20,
  },
  {
    field_name: 'Email',
    enabled: true,
    editable: false,
    registerable: true,
    required: true,
    pattern_id: 3,
    min: 5,
    max: 40,
  },
  {
    field_name: 'QQ',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 2,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Wechat',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Line',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Whatsapp',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Facebook',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Zalo',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 3,
    min: 5,
    max: 20,
  },
  {
    field_name: 'Birthday',
    enabled: true,
    editable: false,
    registerable: true,
    required: false,
    pattern_id: 11,
    min: 10,
    max: 10,
  },
  {
    field_name: 'Bank Card',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 10,
    max: 20,
  },
  {
    field_name: 'customerInfo.row.telegram',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 2,
    min: 10,
    max: 20,
  },
  {
    field_name: 'customerInfo.row.twitter',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 1,
    min: 10,
    max: 20,
  },
  {
    field_name: 'customerInfo.row.viber',
    enabled: false,
    editable: false,
    registerable: false,
    required: false,
    pattern_id: 2,
    min: 10,
    max: 20,
  },
])

onMounted(async () => {
  checkPartnerCode()
  initRegisterInfoRules()
  await initProfile()
  window.addEventListener('resize', updateScreenWidth)
  updateScreenWidth()
  syncProfilePolling()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenWidth)
  stopProfilePolling()
})

watch(
  () => userStore.isLoggedIn,
  () => {
    syncProfilePolling()
  },
)

function updateScreenWidth() {
  if (typeof window === 'undefined') return
  globalUiStore.setIsPC(window.innerWidth)
}

function checkPartnerCode() {
  if (route.query.partnercode) {
    globalUiStore.setKeepPartnerCode(route.query.partnercode)
  }
}

async function initRegisterInfoRules() {
  const map = new Map(patterns.map((p) => [p.id, p]))
  const merged = (apiPatterns.value || []).map((f) => {
    const min = Number(f.min)
    const max = Number(f.max)
    const hasLen = Number.isFinite(min) && Number.isFinite(max)
    const base = map.get(f.pattern_id) || null
    const arr = []
    if (base)
      arr.push({
        ...base,
        regexSource: base.regex?.source,
        regexFlags: base.regex?.flags || '',
      })
    if (hasLen) {
      arr.push({
        id: `length-${min}-${max}`,
        regex: new RegExp(`^.{${min},${max}}$`),
        regexSource: `^.{${min},${max}}$`,
        regexFlags: '',
        key: 'patterns.lengthRange',
        description: 'patterns.lengthRange',
        i18nParams: { min, max },
        name: 'lengthRange',
      })
    }
    return {
      ...f,
      patterns: arr,
    }
  })
  apiRulesStore.setRules(merged)
}

async function initProfile() {
  const { initProfile } = useAuthInitProfile()
  await initProfile({ redirectIfMissingAuth: false })
}

function stopProfilePolling() {
  if (profileIntervalId) {
    clearInterval(profileIntervalId)
    profileIntervalId = null
  }
}

function syncProfilePolling() {
  const token = useCookie('token')
  const refreshToken = useCookie('refreshToken')
  const hasAuth = userStore.isLoggedIn || Boolean(token.value || refreshToken.value)

  if (!hasAuth) {
    stopProfilePolling()
    return
  }

  stopProfilePolling()
  profileIntervalId = setInterval(async () => {
    await initProfile()
  }, 30_000)
}
</script>
