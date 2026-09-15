import { clearAuthState } from '~/composables/request/auth'
import { useAlertStore } from '~/stores/alert'
import { useUserStore } from '~/stores/user'

export function normalizeRequestError (error) {
  const statusCode = error.response?.status || 500
  const backend = error.response?._data || error.data || null
  const statusText = error.response?.statusText
  const backendMessage = backend?.message || backend?.error || ''
  const rawMessage = error.message || ''
  const isNetworkError = !error.response && (
    rawMessage.includes('Failed to fetch') ||
    rawMessage.includes('<no response>') ||
    error.name === 'FetchError' ||
    error.name === 'TypeError'
  )
  const statusMessage = isNetworkError
    ? 'Network error, please try again later'
    : backendMessage || statusText || rawMessage || 'Unknown error'

  return {
    backend,
    backendMessage,
    isNetworkError,
    statusCode,
    statusMessage
  }
}

export function createApiError ({ backend, statusCode, statusMessage }) {
  throw createError({
    statusCode,
    statusMessage,
    message: statusMessage,
    data: backend || undefined
  })
}

export function showApiErrorAlert ({ statusMessage }) {
  if (typeof window === 'undefined') return

  const alert = useAlertStore()
  const msg = statusMessage || 'Server error'

  if (!alert.show) {
    alert.openError(msg, { cancellable: false })
  }
}

export function handleSessionError ({ backend, backendMessage }) {
  if (backend?.error === 'duplicate login' || backendMessage === 'duplicate login') {
    const alert = useAlertStore()
    clearAuthState()

    const { $i18n } = useNuxtApp()
    const msg =
      typeof $i18n?.t === 'function'
        ? $i18n.t('common.duplicateLogin')
        : 'You’ve been logged out. Please log in again.'

    if (!alert.show) {
      alert.openError(msg, { cancellable: false, redirectUrl: '/' })
    }

    throw createError({
      statusCode: 401,
      statusMessage: msg,
      message: msg,
      data: backend || undefined
    })
  }

  if (backend?.error === 'token is blacklisted') {
    clearAuthState(useUserStore())
    navigateTo('/')

    throw createError({
      statusCode: 401,
      statusMessage: 'token is blacklisted',
      message: 'token is blacklisted',
      data: backend || undefined
    })
  }
}

export function shouldRefreshAuth ({ backendMessage, refreshCookie, statusCode, url }) {
  const isAuthRefreshCall = url.includes('/api/auth/refresh')
  const hasRefreshToken = !!refreshCookie?.value

  return (
    !isAuthRefreshCall &&
    hasRefreshToken &&
    (statusCode === 401 || backendMessage.toLowerCase().includes('token'))
  )
}
