import { TENANT_HEADER } from '@profixer/constants'
import { isAuthCredentialFailure401, normalizeApiError } from './errors'
import type {
  ApiClient,
  ApiError,
  ApiResponse,
  CreateApiClientOptions,
  RequestConfig,
} from './types'

async function resolve<T>(value: T | Promise<T>): Promise<T> {
  return value
}

function emptyBodyApiError(status: number): ApiError {
  const messages: Record<number, string> = {
    403:
      'Access denied (403). On Android emulator use API_URL=http://10.0.2.2:8005/api (not localhost). Rebuild the app after changing .env.',
    404:
      'API route not found (404). API_URL must end with /api (e.g. http://10.0.2.2:8005/api).',
    502: 'Bad gateway — is the backend running on port 8005?',
    503: 'Service unavailable — is the backend running?',
  }
  return {
    code: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
    message: messages[status] ?? `Server returned ${status} with an empty body.`,
    status,
  }
}

async function readResponseJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text.trim()) {
    if (!response.ok) {
      throw emptyBodyApiError(response.status)
    }
    return {}
  }
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw {
      code: 'INTERNAL_ERROR',
      message:
        'Invalid response from server. Check API_URL in .env and that the backend is running.',
      status: response.status,
    } satisfies ApiError
  }
}

function buildUrl(baseURL: string, endpoint: string, params?: Record<string, unknown>): string {
  const base = baseURL.replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let url = `${base}${path}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .reduce<Record<string, string>>((acc, [k, v]) => {
          acc[k] = String(v)
          return acc
        }, {}),
    ).toString()
    if (qs) url += `?${qs}`
  }
  return url
}

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const {
    baseURL,
    getToken,
    getTenantId,
    tenantHeader = TENANT_HEADER,
    timeout = 10_000,
    retryAttempts = 3,
    onUnauthorized,
  } = options

  async function createHeaders(
    custom: Record<string, string> = {},
    omitContentType = false,
  ): Promise<HeadersInit> {
    const token = await resolve(getToken())
    const tenantId = getTenantId ? await resolve(getTenantId()) : null
    const extra = { ...custom }
    if (omitContentType) {
      delete extra['Content-Type']
      delete extra['content-type']
    }
    return {
      ...(omitContentType ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
      ...(tenantId ? { [tenantHeader]: tenantId } : {}),
    }
  }

  async function handleResponse<T>(
    response: Response,
    endpoint: string,
  ): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      if (isAuthCredentialFailure401(endpoint)) {
        let data: Record<string, unknown> = {}
        try {
          data = await readResponseJson(response)
        } catch (err) {
          if (err && typeof err === 'object' && 'message' in err) throw err
          /* empty / unreadable body on 401 */
        }
        const err = (data.error as Record<string, unknown> | undefined) ?? data
        const rawCode = err?.code as string | undefined
        const code =
          rawCode && rawCode !== 'UNAUTHORIZED'
            ? (rawCode as ApiError['code'])
            : 'VALIDATION_ERROR'
        throw {
          code,
          message: (err?.message as string) || 'Request failed.',
          details: err?.details,
          status: 401,
        } satisfies ApiError
      }
      onUnauthorized?.()
      throw {
        code: 'UNAUTHORIZED',
        message: 'Session expired. Please login again.',
        status: 401,
      } satisfies ApiError
    }

    const data = await readResponseJson(response)
    if (!response.ok) {
      throw normalizeApiError(response.status, data)
    }

    const metaBlock =
      data.meta != null && typeof data.meta === 'object'
        ? { meta: data.meta as Record<string, unknown> }
        : {}

    return {
      success: data.success === true,
      data: data.data as T,
      message:
        typeof data.message === 'string' && data.message.trim() ? data.message.trim() : 'Success',
      timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
      ...metaBlock,
    }
  }

  async function request<T>(
    endpoint: string,
    init: RequestInit & { config?: RequestConfig },
    attempt = 1,
  ): Promise<ApiResponse<T>> {
    const { config, ...fetchInit } = init
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout ?? timeout)
    const signal = config?.signal ?? controller.signal

    try {
      const url = buildUrl(baseURL, endpoint, config?.params)
      const isFormData =
        typeof FormData !== 'undefined' && fetchInit.body instanceof FormData
      const headers = await createHeaders(config?.headers, isFormData)

      const response = await fetch(url, {
        ...fetchInit,
        headers,
        signal,
      })

      return await handleResponse<T>(response, endpoint)
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
        throw error as ApiError
      }

      const apiError = error as ApiError
      // Detect AbortError without referencing the `DOMException` global
      // (it doesn't exist in Hermes / React Native). Name + message check
      // works in browsers, Node, and Hermes alike.
      const isAbort =
        (error instanceof Error &&
          (error.name === 'AbortError' || /aborted|abort/i.test(error.message)) &&
          !('status' in error))

      if (isAbort) {
        throw {
          code: 'INTERNAL_ERROR',
          message: 'Request timed out. Please try again.',
          status: 408,
        } satisfies ApiError
      }

      const status = apiError.status
      const canRetry =
        attempt < retryAttempts && typeof status === 'number' && status >= 500
      if (canRetry) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        return request<T>(endpoint, init, attempt + 1)
      }
      throw apiError
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    get: (endpoint, config) => request(endpoint, { method: 'GET', config }),
    post: (endpoint, body, config) =>
      request(endpoint, {
        method: 'POST',
        body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
        config,
      }),
    put: (endpoint, body, config) =>
      request(endpoint, {
        method: 'PUT',
        body: body != null ? JSON.stringify(body) : undefined,
        config,
      }),
    patch: (endpoint, body, config) =>
      request(endpoint, {
        method: 'PATCH',
        body: body != null ? JSON.stringify(body) : undefined,
        config,
      }),
    delete: (endpoint, config) => request(endpoint, { method: 'DELETE', config }),
    uploadFile: (endpoint, formData, config) =>
      request(endpoint, { method: 'POST', body: formData, config }),
  }
}
