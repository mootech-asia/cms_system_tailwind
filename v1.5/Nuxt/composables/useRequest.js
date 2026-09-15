import { clearAuthState, getAuthCookies, refreshAuthToken } from '~/composables/request/auth'
import {
  createApiError,
  handleSessionError,
  normalizeRequestError,
  showApiErrorAlert,
  shouldRefreshAuth
} from '~/composables/request/errors'
import { useUserStore } from '~/stores/user'
import { getCurrentLanguage } from '~/composables/useLanguage'

function buildHeaders ({ config, lang, tokenValue, headers = {} }) {
  const authHeader = tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}

  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': config.public.tenantId,
    'X-Brand-ID': config.public.brandId,
    'X-Language': lang,
    ...authHeader,
    ...headers
  }
}

function assertSuccessResult (result) {
  if (typeof result === 'object' && result.code && result.code !== 200) {
    throw new Error(result.message || 'Request failed')
  }
}

export const request = async (url, method = 'GET', data, opts = {}) => {
  const config = useRuntimeConfig()
  const lang = getCurrentLanguage()
  const userStore = useUserStore()
  const { tokenCookie, refreshCookie } = getAuthCookies()
  const { silent = false, ...fetchOpts } = opts

  if (userStore.profile && !tokenCookie?.value && !refreshCookie?.value) {
    clearAuthState(userStore)
    navigateTo('/')
  }

  const doRequestOnce = async (overrideToken) => {
    const tokenValue = overrideToken ?? tokenCookie?.value
    const options = {
      method,
      baseURL: config.public.apiBase,
      headers: buildHeaders({
        config,
        lang,
        tokenValue,
        headers: fetchOpts.headers
      }),
      ...fetchOpts
    }

    if (method === 'GET') {
      options.params = data
    } else {
      options.body = data
    }

    return await $fetch(url, options)
  }

  try {
    if ((!tokenCookie?.value || tokenCookie.value === '') && refreshCookie?.value) {
      try {
        await refreshAuthToken({ config, lang })
      } catch (preRefreshError) {
        console.error('Pre-request token refresh failed:', preRefreshError)
        clearAuthState(userStore)
      }
    }

    const result = await doRequestOnce()
    assertSuccessResult(result)
    return result
  } catch (error) {
    console.error('API Error:', error)

    const requestError = normalizeRequestError(error)
    handleSessionError(requestError)

    if (shouldRefreshAuth({ ...requestError, refreshCookie, url })) {
      try {
        const newToken = await refreshAuthToken({ config, lang })
        const retryResult = await doRequestOnce(newToken)
        assertSuccessResult(retryResult)
        return retryResult
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        clearAuthState(userStore)
        navigateTo('/')

        throw createError({
          statusCode: refreshError.response?.status || 401,
          statusMessage: refreshError.message || 'Token refresh failed',
          message: refreshError.message || 'Token refresh failed',
          data: refreshError.response?._data || undefined
        })
      }
    }

    if (!silent) showApiErrorAlert(requestError)
    createApiError(requestError)
  }
}
