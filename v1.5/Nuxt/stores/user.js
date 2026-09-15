import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const withdrawalFormData = ref({})

  const isLoggedIn = computed(() => !!profile.value)

  function setProfile (data) {
    profile.value = data || null
  }

  function setWithdrawalFormData (data) {
    withdrawalFormData.value = data || {}
  }

  function clearProfile () {
    profile.value = null
  }

  return {
    profile,
    isLoggedIn,
    setProfile,
    withdrawalFormData,
    setWithdrawalFormData,
    clearProfile
  }
})
