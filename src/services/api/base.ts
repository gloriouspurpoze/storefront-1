import { store } from '../../store'
import { setLoading, addToast } from '../../store/slices/uiSlice'
// DISABLED: Auto refresh token functionality (commented out for now)
// import { refreshAuthToken, logout } from '../../store/slices/authSlice'
import { logout } from '../../store/slices/authSlice'
import { ErrorHandler, isAuthCredentialFailure401 } from './error-handler'
import { TENANT_HEADER } from '../../lib/saasEnv'

// API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  retryAttempts: 3,
}

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  showLoading?: boolean
  loadingMessage?: string
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
  timeout?: number
}

// Response interface
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  timestamp?: string
  error?: string | { message: string; code?: string }
  meta?: {
    pagination?: { page: number; limit: number; total: number; totalPages: number }
    filters?: Record<string, unknown>
    [key: string]: unknown
  }
}

// Error interface
interface ApiError {
  code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'INTERNAL_ERROR'
  message: string
  details?: any
  status: number
}

/**
 * Professional API Base Service
 * Handles all HTTP requests with automatic loading states, error handling, and notifications
 */
class ApiBase {
  private baseURL: string
  private timeout: number
  private retryAttempts: number
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
    this.retryAttempts = API_CONFIG.retryAttempts
  }

  /**
   * Get authentication token from Redux store
   */
  private getAuthToken(): string | null {
    const state = store.getState()
    return state.auth?.token || null
  }

  /**
   * Get refresh token from Redux store
   */
  private getRefreshToken(): string | null {
    const state = store.getState()
    return state.auth?.refreshToken || null
  }

  /**
   * Subscribe to token refresh
   */
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback)
  }

  /**
   * Notify all subscribers when token is refreshed
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token))
    this.refreshSubscribers = []
  }

  /**
   * Handle token refresh
   * DISABLED: Auto refresh token functionality (commented out for now)
   */
  /*
  private async handleTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      console.error('No refresh token available')
      store.dispatch(logout())
      return null
    }

    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise(resolve => {
        this.subscribeTokenRefresh((token: string) => {
          resolve(token)
        })
      })
    }

    this.isRefreshing = true

    try {
      // Dispatch the refresh action
      const result = await store.dispatch(refreshAuthToken(refreshToken))
      
      if (refreshAuthToken.fulfilled.match(result)) {
        const newToken = result.payload.tokens?.accessToken || result.payload.token
        this.onTokenRefreshed(newToken)
        this.isRefreshing = false
        return newToken
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      this.isRefreshing = false
      store.dispatch(logout())
      return null
    }
  }
  */

  /**
   * Show loading state
   */
  private showLoading(message: string) {
    store.dispatch(setLoading({ isLoading: true, message }))
  }

  /**
   * Hide loading state
   */
  private hideLoading() {
    store.dispatch(setLoading({ isLoading: false }))
  }

  /**
   * Show success toast
   */
  private showSuccessToast(message: string) {
    store.dispatch(addToast({
      message,
      severity: 'success',
      duration: 4000,
    }))
  }

  /**
   * Show error toast
   */
  private showErrorToast(message: string) {
    store.dispatch(addToast({
      message,
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Create request headers
   * For FormData bodies, omit Content-Type so the browser sets multipart boundary.
   */
  private createHeaders(
    customHeaders: Record<string, string> = {},
    omitContentType = false
  ): HeadersInit {
    const token = this.getAuthToken()
    const tenantId = store.getState().tenant?.tenantId ?? null
    const extra = { ...customHeaders }
    if (omitContentType) {
      delete (extra as Record<string, string>)['Content-Type']
      delete (extra as Record<string, string>)['content-type']
    }

    return {
      ...(omitContentType ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...extra,
      ...(tenantId ? { [TENANT_HEADER]: tenantId } : {}),
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, endpoint: string, originalConfig: RequestConfig): Promise<ApiResponse<T>> {
    // Handle 401 Unauthorized - Token expired
    // DISABLED: Auto refresh token functionality (commented out for now)
    /*
    if (response.status === 401 && !endpoint.includes('/auth/refresh-token') && !endpoint.includes('/auth/login')) {
      console.log('Token expired, attempting to refresh...')
      
      const newToken = await this.handleTokenRefresh()
      
      if (newToken) {
        // Retry the original request with new token
        console.log('Retrying request with new token...')
        return this.request<T>(endpoint, originalConfig)
      } else {
        throw {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please login again.',
          status: 401,
        } as ApiError
      }
    }
    */

    // If 401: session expired (redirect in ErrorHandler) — unless this is login/register-style failure
    if (response.status === 401) {
      if (isAuthCredentialFailure401(endpoint)) {
        let data: Record<string, unknown> = {}
        try {
          data = (await response.json()) as Record<string, unknown>
        } catch {
          /* empty body */
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
        } as ApiError
      }
      throw {
        code: 'UNAUTHORIZED',
        message: 'Session expired. Please login again.',
        status: 401,
      } as ApiError
    }

    const data = (await response.json()) as Record<string, unknown>
    
    if (!response.ok) {
      const errField = data.error
      let message = `HTTP error! status: ${response.status}`
      let code: ApiError['code'] = 'INTERNAL_ERROR'
      let details: unknown

      if (typeof errField === 'string' && errField.trim()) {
        message = errField.trim()
      } else if (errField && typeof errField === 'object') {
        const o = errField as Record<string, unknown>
        if (typeof o.message === 'string' && o.message.trim()) message = o.message.trim()
        if (typeof o.code === 'string' && o.code.trim()) code = o.code as ApiError['code']
        details = o.details
      } else if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message.trim()
      }

      const errs = data.errors
      if (Array.isArray(errs) && errs.length > 0) {
        const parts = errs.map((e: unknown) => {
          if (typeof e === 'string') return e
          if (e && typeof e === 'object' && 'msg' in e) return String((e as { msg?: unknown }).msg || '')
          return ''
        }).filter(Boolean)
        if (parts.length) message = parts.join('. ')
        code = 'VALIDATION_ERROR'
      }

      if (response.status === 400 && code === 'INTERNAL_ERROR') code = 'VALIDATION_ERROR'
      if (response.status === 403) code = 'FORBIDDEN'
      if (response.status === 404) code = 'NOT_FOUND'
      if (response.status === 409) code = 'CONFLICT'
      if (response.status === 429) code = 'RATE_LIMITED'

      throw {
        code,
        message,
        details,
        status: response.status,
      } as ApiError
    }

    const metaBlock =
      data.meta != null && typeof data.meta === 'object'
        ? { meta: data.meta as Record<string, unknown> }
        : {}

    return {
      success: data.success === true,
      data: data.data as T,
      message: typeof data.message === 'string' && data.message.trim() ? data.message.trim() : 'Success',
      timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
      ...metaBlock,
    }
  }

  /**
   * Retry failed requests (5xx only). Error toasts are shown once here after retries
   * exhaust — not on every attempt — otherwise users see duplicate stacked snackbars.
   */
  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const showErrorToast = config.showErrorToast ?? true
    const errorMessage = config.errorMessage ?? 'An error occurred'
    try {
      return await requestFn()
    } catch (error) {
      const apiError = error as ApiError
      const status = apiError.status
      const canRetry =
        attempt < this.retryAttempts &&
        typeof status === 'number' &&
        status >= 500
      if (canRetry) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
        return this.retryRequest(requestFn, config, attempt + 1)
      }
      if (showErrorToast) {
        ErrorHandler.handleApiError(apiError, errorMessage)
      }
      throw apiError
    }
  }

  /**
   * Main request method
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      showLoading = true,
      loadingMessage = 'Loading...',
      showSuccessToast = true,
      successMessage = 'Operation completed successfully',
      timeout = this.timeout,
    } = config

    // Show loading if enabled
    if (showLoading) {
      this.showLoading(loadingMessage)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Build URL with query parameters if params are provided
      let url = `${this.baseURL}${endpoint}`
      if (config?.params) {
        const queryString = new URLSearchParams(
          Object.entries(config.params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .reduce((acc, [key, value]) => {
              acc[key] = String(value)
              return acc
            }, {} as Record<string, string>)
        ).toString()
        if (queryString) {
          url += `?${queryString}`
        }
      }

      const isFormData =
        typeof FormData !== 'undefined' && body instanceof FormData

      const response = await fetch(url, {
        method,
        headers: this.createHeaders(headers, isFormData),
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const result = await this.handleResponse<T>(response, endpoint, config)

      // Show success toast if enabled
      if (showSuccessToast) {
        this.showSuccessToast(successMessage)
      }

      return result
    } catch (error) {
      const apiError = error as ApiError
      // Error toast is handled in retryRequest once retries are exhausted (avoids
      // 3 identical toast when a 5xx is retried up to retryAttempts).
      throw apiError
    } finally {
      // Hide loading if enabled
      if (showLoading) {
        this.hideLoading()
      }
    }
  }

  /**
   * HTTP Methods
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const merged: RequestConfig = { ...config, method: 'GET' }
    return this.retryRequest(() => this.request<T>(endpoint, merged), merged)
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const merged: RequestConfig = { ...config, method: 'POST', body }
    return this.retryRequest(() => this.request<T>(endpoint, merged), merged)
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const merged: RequestConfig = { ...config, method: 'PUT', body }
    return this.retryRequest(() => this.request<T>(endpoint, merged), merged)
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const merged: RequestConfig = { ...config, method: 'PATCH', body }
    return this.retryRequest(() => this.request<T>(endpoint, merged), merged)
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const merged: RequestConfig = { ...config, method: 'DELETE' }
    return this.retryRequest(() => this.request<T>(endpoint, merged), merged)
  }

  /**
   * File upload method
   */
  async uploadFile<T>(
    endpoint: string, 
    formData: FormData, 
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    const {
      showLoading = true,
      loadingMessage = 'Uploading file...',
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = 'File uploaded successfully',
      errorMessage = 'File upload failed',
    } = config || {}

    if (showLoading) {
      this.showLoading(loadingMessage)
    }

    try {
      const token = this.getAuthToken()
      const tenantId = store.getState().tenant?.tenantId ?? null
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(tenantId ? { [TENANT_HEADER]: tenantId } : {}),
        },
        body: formData,
      })

      const result = await this.handleResponse<T>(response, endpoint, config || {})

      if (showSuccessToast) {
        this.showSuccessToast(successMessage)
      }

      return result
    } catch (error) {
      const apiError = error as ApiError
      
      if (showErrorToast) {
        ErrorHandler.handleFileUploadError(apiError)
      }

      throw apiError
    } finally {
      if (showLoading) {
        this.hideLoading()
      }
    }
  }
}

// Export singleton instance
export const api = new ApiBase()

// Export types
export type { RequestConfig, ApiResponse, ApiError }
