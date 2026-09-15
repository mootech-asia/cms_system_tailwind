<template lang="pug">
Navbar
main(class="xl:pt-[137px]")
  UserNavbar
  div(class="grid grid-cols-1 xl:grid-cols-[260px_1fr] overflow-x-hidden")
    UserSidebar
    div(class="w-[100vw] overflow-x-hidden bg-white")
      slot
Footer
BottomNavbar
SideBar
AlertModal
CustomerServiceModal
</template>
<script setup>
import { watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useAuthInitProfile } from '~/composables/useAuthInitProfile'

const token = useCookie('token')
const refreshToken = useCookie('refreshToken')

let profileIntervalId = null

watchEffect(() => {
  if (!token.value && !refreshToken.value) {
    navigateTo('/')
  }
})

onMounted(async () => {
  await initProfile()
  loopGetProfile()
})

onBeforeUnmount(() => {
  if (profileIntervalId) {
    clearInterval(profileIntervalId)
    profileIntervalId = null
  }
})

async function initProfile() {
  const { initProfile } = useAuthInitProfile()
  await initProfile({ redirectIfMissingAuth: true, redirectTo: '/' })
}

function loopGetProfile() {
  if (profileIntervalId) {
    clearInterval(profileIntervalId)
    profileIntervalId = null
  }
  profileIntervalId = setInterval(async () => {
    await initProfile()
  }, 30_000)
}
</script>
