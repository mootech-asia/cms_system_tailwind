<template lang="pug">
div(class="relative")
  div(v-if="open" class="absolute z-50 left-0 right-0 border border-[#0A1140]/40 bg-white shadow-lg rounded-md overflow-hidden hidden xl:block")
    div(class="max-h-[18rem] overflow-y-auto divide-y divide-[#060C34]")
      div(v-for="b in items" :key="b.value" class="px-4 h-10 flex items-center cursor-pointer hover:bg-[#F5F7FB] text-[#060C34]" @click="onSelect(b)") {{ b.label }}
  div(v-if="open" class="xl:hidden fixed left-0 right-0 w-[100vw] inset-0 z-[60] flex items-end justify-center bg-black/50" @click.self="emit('update:open', false)")
    div(class="w-screen max-w-none max-h-[70vh] rounded-t-xl bg-white shadow-xl overflow-hidden")
      div(class="max-h-[60vh] overflow-y-auto divide-y divide-[#060C34]")
        div(v-for="b in items" :key="b.value" class="px-4 h-12 flex items-center cursor-pointer hover:bg-[#F5F7FB] text-[#060C34]" @click="onSelect(b)") {{ b.label }}
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open', 'select'])
function onSelect(b) {
  emit('select', b)
  emit('update:open', false)
}
</script>

<style scoped></style>
