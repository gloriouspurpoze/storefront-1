export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: unknown
  status: number
}

export interface ApiResponse<T = unknown> {
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

export type RequestConfig = {
  headers?: Record<string, string>
  params?: Record<string, unknown>
  timeout?: number
  signal?: AbortSignal
}

export type CreateApiClientOptions = {
  baseURL: string
  getToken: () => string | null | Promise<string | null>
  getTenantId?: () => string | null | Promise<string | null>
  tenantHeader?: string
  timeout?: number
  retryAttempts?: number
  /** Called on session-expired 401 (not login/register). */
  onUnauthorized?: () => void
}

export interface ApiClient {
  get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>
  post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>
  uploadFile<T>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<ApiResponse<T>>
}
