<template lang="pug">
main(class="bg-[#060C34] pt-8 xl:pt-[64px]")
  iframe(
    v-if="iframeUrl"
    :src="iframeUrl"
    class="w-full h-[calc(100vh-64px)]"
    frameborder="0"
    allowfullscreen
  )

</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useI18n } from 'vue-i18n'
import { useAlertStore } from '~/stores/alert'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalUiStore } from '~/stores/globalUi'
import { api } from '~/composables/useApi'

const userStore = useUserStore()
const alert = useAlertStore()
const route = useRoute()
const router = useRouter()
const globalUiStore = useGlobalUiStore()
const { t } = useI18n()

const isPC = computed(() => Boolean(globalUiStore.isPC))
const iframeUrl = ref('')

async function openGame() {
  const vendor = String(route.query.vendor || '')
  const gameId = String(route.query.gameId || '')

  if (!vendor || !gameId) {
    alert.openError(t('common.error'), { cancellable: false })
    return
  }

  const res = await api.openGame({
    vendor_code: vendor,
    game_code: gameId,
    currency: 'krw',
    platform: isPC.value ? 'web' : 'mobile',
  })

  if (res.success && res?.data) {
  const mq = window.matchMedia('(min-width: 1281px)')
    if (mq.matches) {
      iframeUrl.value = res.data
    } else {
      window.open(res.data, '_blank')
      router.go(-1)
    }
  } else {
    alert.openError(res.message, { cancellable: false })
  }
}

watch(
  () => [
    userStore.isLoggedIn
  ],
  () => {
    openGame()
  },
  { immediate: true },
)
</script>