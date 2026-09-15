<template lang="pug">
teleport(to="body")
  transition(name="fade" appear)
    div(v-if="alert.show" class="fixed inset-0 z-[1000] flex items-center justify-center bg-[#28262ECC]/80 p-4" @click.self="alert.closeOnBackdrop ? close() : null")
      div(class="relative w-full max-w-[360px] overflow-hidden rounded-[28px] bg-[#3A3A3A] shadow-xl")
        div(class="alert-glow-mask pointer-events-none absolute inset-0")
          div(class="alert-gradient-glow absolute inset-0")
        div(class="flex flex-col items-center gap-3 px-6 pt-6 pb-4")
          NuxtImg(v-if="alert.type === 'error'" src="/images/icon/error.svg" alt="error" class="w-20 h-20")
          NuxtImg(v-else-if="alert.type === 'confirmation'" src="/images/icon/confirmation.svg" alt="error" class="w-20 h-20")
          NuxtImg(v-else src="/images/icon/success.svg" alt="success" class="w-20 h-20")
          h3(class="text-xl font-bold text-white text-center") {{ titleComputed }}
          p(class="text-[16px] text-white/50 text-center") {{ alert.message }}
        div(class="px-6 pb-5")
          button(type="button" class="w-full h-10 rounded-full text-[#060C34]/80 text-lg font-bold transition-all duration-300 bg-gradient-to-r from-[#E528A5] to-[#F3AC2F] hover:from-[#E52865] hover:to-[#E52865] hover:text-white" @click="onConfirm") 
            | {{ alert.type === 'confirmation' ? $t('common.submit') : $t('common.gotIt') }}
          button(v-if="alert.cancellable && alert.type !== 'success'" type="button" class="mt-2 w-full h-10 rounded-lg bg-transparent text-white/60 font-semibold" @click="onCancel") {{ $t('common.cancel') }}
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlertStore } from '~/stores/alert'

const props = defineProps({
  redirectUrl: { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'cancel'])
const alert = useAlertStore()

const { t } = useI18n()

const titleComputed = computed(() => {
  if (alert.title) return alert.title
  if (alert.type === 'error') return t('common.warning')
  if (alert.type === 'confirmation') return t('common.confirmation')
  return t('common.success')
})

function close() {
  alert.close()
}

async function onConfirm() {
  const originalType = alert.type
  const callback = alert.onConfirmCallback
  const target = props.redirectUrl || alert.redirectUrl

  // 清掉 callback，避免後續 alert（例如 success）再次觸發同一個動作
  alert.onConfirmCallback = null

  emit('confirm')

  // 對於 confirmation，先關閉當前彈窗，再執行 callback（callback 內若開 success alert 不會被關掉）
  if (originalType === 'confirmation') {
    close()
  }

  if (typeof callback === 'function') {
    await callback()
  }

  if (target) {
    await navigateTo(target)
  }

  // 非 confirmation 類型（一般 success/error）才在最後自動關閉
  if (originalType !== 'confirmation') {
    close()
  }
}

function onCancel() {
  emit('cancel')
  close()
}
</script>

<style scoped>
.alert-glow-mask {
  -webkit-mask-image: linear-gradient(180deg, #000 0, #000 0, transparent 20px);
  mask-image: linear-gradient(180deg, #000 0, #000 0, transparent 20px);
}

.alert-gradient-glow {
  border-radius: 28px;
  padding: 3px;
  background: linear-gradient(90deg, var(--linear-gradient-pink) 0%, var(--linear-gradient-orange) 100%);
  opacity: 0.95;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
