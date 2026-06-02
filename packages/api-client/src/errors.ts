import type { ApiError, ApiErrorCode } from './types'

const AUTH_401_NOT_SESSION_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
] as const

export function isAuthCredentialFailure401(endpoint: string): boolean {
  return AUTH_401_NOT_SESSION_ENDPOINTS.some((p) => endpoint.includes(p))
}

export function normalizeApiError(status: number, data: Record<string, unknown>): ApiError {
  const errField = data.error
  let message = `HTTP error! status: ${status}`
  let code: ApiErrorCode = 'INTERNAL_ERROR'
  let details: unknown

  if (typeof errField === 'string' && errField.trim()) {
    message = errField.trim()
  } else if (errField && typeof errField === 'object') {
    const o = errField as Record<string, unknown>
    if (typeof o.message === 'string' && o.message.trim()) message = o.message.trim()
    if (typeof o.code === 'string' && o.code.trim()) code = o.code as ApiErrorCode
    details = o.details
  } else if (typeof data.message === 'string' && data.message.trim()) {
    message = data.message.trim()
  }

  const errs = data.errors
  if (Array.isArray(errs) && errs.length > 0) {
    const parts = errs
      .map((e: unknown) => {
        if (typeof e === 'string') return e
        if (e && typeof e === 'object' && 'msg' in e) return String((e as { msg?: unknown }).msg || '')
        return ''
      })
      .filter(Boolean)
    if (parts.length) message = parts.join('. ')
    code = 'VALIDATION_ERROR'
  }

  if (status === 400 && code === 'INTERNAL_ERROR') code = 'VALIDATION_ERROR'
  if (status === 403) code = 'FORBIDDEN'
  if (status === 404) code = 'NOT_FOUND'
  if (status === 409) code = 'CONFLICT'
  if (status === 429) code = 'RATE_LIMITED'

  return { code, message, details, status }
}
