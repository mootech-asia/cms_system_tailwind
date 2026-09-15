import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useGlobalUiStore = defineStore('globalUi', () => {
  const showMobileUserCenterNavbar = ref(false)
  const announcements = shallowRef([])
  const gameList = shallowRef([])
  const vendorList = shallowRef([])
  const favoriteList = ref([])
  const isPC = ref(false)
  const keepPartnerCode = ref(null)
  const showCustomerServiceModal = ref(false)

  function setShowMobileUserCenterNavbar (data) {
    showMobileUserCenterNavbar.value = data
  }

  function setAnnouncements (data) {
    announcements.value = data
  }

  function setGameList (data) {
    gameList.value = data
  }

  function setVendorList (data) {
    vendorList.value = data
  }

  function setIsPC (size) {
    isPC.value = size >= 1280
  }

  function setKeepPartnerCode (code) {
    keepPartnerCode.value = code
  }

  function setFavoriteList (data) {
    favoriteList.value = data
  }

  function setShowCustomerServiceModal (value) {
    showCustomerServiceModal.value = value
  }

  return {
    showMobileUserCenterNavbar,
    setShowMobileUserCenterNavbar,
    announcements,
    setAnnouncements,
    gameList,
    setGameList,
    vendorList,
    setVendorList,
    favoriteList,
    setFavoriteList,
    isPC,
    setIsPC,
    keepPartnerCode,
    setKeepPartnerCode,
    showCustomerServiceModal,
    setShowCustomerServiceModal
  }
})
