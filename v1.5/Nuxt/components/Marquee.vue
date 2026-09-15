<template lang="pug">
section
  div(class="marquee-frame w-full bg-[#1A214F] h-[26px] relative text-sm cursor-pointer ")
    div(class="overflow-hidden mr-[220px]")
      div(class="marquee-content flex w-max whitespace-nowrap will-change-transform" aria-hidden="true")
        div(class="inline-flex gap-8 flex-none pt-[3px]")
          p(v-for="(item, idx) in items" :key="`a-${idx}`" class="inline-block font-bold text-white" @click="openModal(item)")
            | ✨ {{ item.title }} ✨
    div(class="absolute right-5 top-1/2 -translate-y-1/2 text-white whitespace-nowrap")
      | {{ nowText }}

  div(v-if="isModalOpen" class="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" @click="closeModal")
    div(class="w-full max-w-[520px] bg-white rounded-xl overflow-hidden shadow-2xl" @click.stop)
      div(class="flex items-center justify-between px-4 py-3 bg-[#060C34]")
        h3(class="text-white text-base font-bold") {{ modalTitle }}
        button(type="button" class="w-9 h-9 rounded-lg bg-transparent text-white text-xl leading-none" @click="closeModal") ×
      div(class="p-4 text-[#060C34] text-sm")
        div(v-html="modalContent")
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGlobalUiStore } from '~/stores/globalUi'

const globalUiStore = useGlobalUiStore()

const items = ref([])

const isModalOpen = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const nowText = ref('')
let timer

function pad(n) {
  return n.toString().padStart(2, '0')
}

function updateNow() {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const y = d.getUTCFullYear()
  const m = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const hh = pad(d.getUTCHours())
  const mm = pad(d.getUTCMinutes())
  const ss = pad(d.getUTCSeconds())
  nowText.value = `GMT+8 ${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

function openModal(item) {
  isModalOpen.value = true
  modalTitle.value = item.title
  modalContent.value = item.content
}

function closeModal() {
  isModalOpen.value = false
}

watch(
  () => globalUiStore.announcements,
  (val) => {
    if (val?.marquee_items) {
      items.value = val.marquee_items
    }
  },
  { immediate: true },
)

onMounted(() => {
  updateNow()
  timer = setInterval(updateNow, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.marquee-content {
  animation: marquee 24s linear infinite;
}
@keyframes marquee {
  0% {
    transform: translateX(100vw);
  }
  100% {
    transform: translateX(-100%);
  }
}

.marquee-frame:hover .marquee-content {
  animation-play-state: paused;
}
</style>
