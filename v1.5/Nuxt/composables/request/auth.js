import { useUserStore } from '~/stores/user'

let refreshPromise = null

export function getAuthCookies () {
  return {
    tokenCookie: useCookie('token'),
    refreshCookie: useCookie('refreshToken')
  }
}

export function clearAuthState (userStore = useUserStore()) {
  const token = useCookie('token', { path: '/' })
  const refresh = useCookie('refreshToken', { path: '/' })

  token.value = null
  refresh.value = null
  userStore.setProfile(null)
}

function getRefreshPayload (refreshResult) {
  return {
    token: refreshResult?.data?.token?.token || refreshResult?.data?.token || '',
    refreshToken:
      refreshResult?.data?.token?.refreshToken || refreshResult?.data?.refreshToken || '',
    expires: Number(refreshResult?.data?.expires) || 0
  }
}

function writeAuthCookies ({ token, refreshToken, expires }) {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = Math.max(0, (expires || now + 60 * 60) - now)
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

  const tokenCookie = useCookie('token', {
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: isHttps
  })
  const refreshCookie = useCookie('refreshToken', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isHttps
  })

  tokenCookie.value = token
  refreshCookie.value = refreshToken
}

async function requestRefreshToken ({ config, lang }) {
  const { refreshCookie } = getAuthCookies()
  const refreshToken = refreshCookie?.value

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing refresh token',
      message: 'Missing refresh token'
    })
  }

  const refreshResult = await $fetch('/api/auth/refresh', {
    method: 'POST',
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.public.tenantId,
      'X-Brand-ID': config.public.brandId,
      'X-Language': lang
    },
    body: {
      refreshToken
    }
  })

  const payload = getRefreshPayload(refreshResult)
  writeAuthCookies(payload)

  return payload.token
}

export async function refreshAuthToken (ctx) {
  if (!refreshPromise) {
    refreshPromise = requestRefreshToken(ctx).finally(() => {
      refreshPromise = null
    })
  }

  return await refreshPromise
}
