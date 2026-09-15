import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApiRulesStore = defineStore('apiRules', () => {
  const rules = ref([])

  function setRules (data) {
    rules.value = data
  }

  return { rules, setRules }
})
