<template lang="pug">
div(v-show="showBottomNavbar" class="fixed bottom-[-1px] z-20 w-full bg-[#060C34] border-t-gradient-primary xl:hidden")
  nav(class="mx-auto max-w-[520px] px-4 py-2")
    ul(class="grid grid-cols-4 gap-2.5")
      li(v-for="(item, i) in items" :key="item.to")
        button(type="button" @click="setActive(item)" class="w-[84px] h-[61px] flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-colors" :class="active === item.labelKey ? 'bg-white' : 'bg-transparent'")
          NuxtImg(:src="item.icon" alt="" class="w-7 h-7" :class="active === item.labelKey ? 'invert' : ''")
          span(:class="['text-sm font-bold', active === item.labelKey ? 'text-[#0A1140]' : 'text-white']") {{ t(`bottomNavbar.${item.labelKey}`) }}
  Login(v-model="showLogin" initialMode="login")

</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'

const items = [
  { labelKey: 'home', to: '/', icon: '/images/icon/nav-home.svg' },
  { labelKey: 'deposit', to: '/usercenter/deposit', icon: '/images/icon/nav-deposit.svg' },
  { labelKey: 'promotion', to: '/promotionlist', icon: '/images/icon/nav-promotion.svg' },
  { labelKey: 'member', to: '/usercenter', icon: '/images/icon/nav-member.svg' },
]

const { t } = useI18n()
const userStore = useUserStore()
const route = useRoute()
const active = ref('home')
const showBottomNavbar = ref(false)
const showLogin = ref(false)
const protectedItems = ['deposit', 'member']

function syncActiveByRoute() {
  const p = route.path.toLowerCase()
  active.value = p.includes('/usercenter') ? 'member' : 'home'
  showBottomNavbar.value = !p.startsWith('/usercenter/')
}

onMounted(syncActiveByRoute)
watch(() => route.fullPath, syncActiveByRoute, { immediate: true })

function setActive(item) {
  if (!userStore.profile && protectedItems.includes(item.labelKey)) {
    showLogin.value = true
    return
  }
  active.value = item.labelKey
  navigateTo(item.to)
}
</script>
