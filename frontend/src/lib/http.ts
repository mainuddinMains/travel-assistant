
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_HTTP_TIMEOUT ?? 10_000)
const IS_DEV = import.meta.env.DEV

let inMemoryToken: string | null = null

export function setAuthToken(token: string | null) {
  inMemoryToken = token
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export function loadAuthTokenFromStorage() {
  inMemoryToken = localStorage.getItem('auth_token')
  return inMemoryToken
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  timeout?: number
  skipAuth?: boolean
  body?: BodyInit | Record<string, unknown> | Array<unknown>
}

function buildHeaders(headersInit: HeadersInit | undefined, includeJson: boolean, skipAuth: boolean) {
  const headers = new Headers(headersInit)
  if (includeJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth && inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`)
  }
  return headers
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get('content-type') ?? ''
  if (res.status === 204 || !contentType.includes('application/json')) {
    return res.text()
  }
  return res.json()
}

function logDebug(message: string, payload: Record<string, unknown>) {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[api] ${message}`, payload)
  }
}

export async function api(path: string, options: ApiOptions = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    skipAuth = false,
    signal,
    headers,
    credentials,
    body,
    ...rest
  } = options

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)

  if (!skipAuth && !inMemoryToken) {
    loadAuthTokenFromStorage()
  }

  const isJsonBody = body !== undefined && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob)
  const requestHeaders = buildHeaders(headers, isJsonBody, skipAuth)

  const preparedBody: BodyInit | null | undefined = isJsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined)

  const requestUrl = `${API_BASE_URL}${path}`
  const requestInit: RequestInit = {
    credentials: credentials ?? 'include',
    ...rest,
    body: preparedBody,
    headers: requestHeaders,
    signal: signal ?? controller.signal,
  }

  logDebug('Request', {
    url: requestUrl,
    method: requestInit.method ?? 'GET',
    credentials: requestInit.credentials,
    headers: Object.fromEntries(requestHeaders.entries()),
  })

  try {
    const res = await fetch(requestUrl, requestInit)

    logDebug('Response headers', {
      url: requestUrl,
      status: res.status,
      cors: res.headers.get('access-control-allow-origin'),
    })

    if (!res.ok) {
      if (res.status === 401) {
        setAuthToken(null)
      }
      const errorBody = await parseResponse(res).catch(() => undefined)
      const error = new Error('Request failed') as Error & { status?: number; data?: unknown }
      error.status = res.status
      error.data = errorBody
      throw error
    }

    return await parseResponse(res)
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      const timeoutError = new Error('Request timed out') as Error & { status?: number }
      timeoutError.status = 408
      throw timeoutError
    }
    logDebug('Network error', {
      url: requestUrl,
      error,
    })
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
