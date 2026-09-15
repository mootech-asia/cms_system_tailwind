import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const show = ref(false)
  const type = ref('success')
  const title = ref('')
  const message = ref('')
  const confirmText = ref('Got It')
  const cancelText = ref('Cancel')
  const cancellable = ref(false)
  const closeOnBackdrop = ref(true)
  const redirectUrl = ref('')
  let onConfirmCallback = null

  function open (payload = {}) {
    if (payload.type) type.value = payload.type
    if (payload.title !== undefined) title.value = payload.title
    if (payload.message !== undefined) message.value = payload.message
    if (payload.confirmText !== undefined) confirmText.value = payload.confirmText
    if (payload.cancelText !== undefined) cancelText.value = payload.cancelText
    if (payload.cancellable !== undefined) cancellable.value = payload.cancellable
    if (payload.closeOnBackdrop !== undefined) closeOnBackdrop.value = payload.closeOnBackdrop
    if (payload.onConfirm !== undefined) onConfirmCallback = payload.onConfirm || null
    if (payload.redirectUrl !== undefined) redirectUrl.value = payload.redirectUrl || ''
    show.value = true
  }

  function openSuccess (msg, options = {}) {
    open({ type: 'success', message: msg, ...options })
  }

  function openError (msg, options = {}) {
    open({ type: 'error', message: msg, ...options })
  }

  function openConfirmation (msg, options = {}) {
    open({ type: 'confirmation', message: msg, ...options })
  }

  function close () {
    show.value = false
    closeOnBackdrop.value = true
    redirectUrl.value = ''
    onConfirmCallback = null
  }

  return {
    show,
    type,
    title,
    message,
    confirmText,
    cancelText,
    cancellable,
    closeOnBackdrop,
    redirectUrl,
    onConfirmCallback,
    open,
    openSuccess,
    openError,
    openConfirmation,
    close
  }
})
