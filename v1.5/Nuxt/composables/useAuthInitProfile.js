import { api } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'

export function useAuthInitProfile () {
  const userStore = useUserStore()

  const initProfile = async ({ redirectIfMissingAuth = false, redirectTo = '/' } = {}) => {
    const token = useCookie('token')
    const refreshToken = useCookie('refreshToken')

    if (!token.value && !refreshToken.value) {
      if (redirectIfMissingAuth) {
        navigateTo(redirectTo)
      }
      return { ok: false, reason: 'missing_auth' }
    }

    try {
      const { data } = await api.getProfile()
      userStore.setProfile({ ...data, remaining_turnover_amount: userStore.profile?.remaining_turnover_amount || '0' })
      return { ok: true, data }
    } catch (error) {
      if (redirectIfMissingAuth) {
        navigateTo(redirectTo)
      }
      return { ok: false, reason: 'error', error }
    }
  }

  return {
    initProfile
  }
}
