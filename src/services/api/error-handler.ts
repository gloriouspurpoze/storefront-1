import { store } from '../../store'
import { logout } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'
import type { ApiError } from './base'

/**
 * Enhanced Error Handler
 * Provides centralized error handling with specific error type handling
 */
export class ErrorHandler {
  /**
   * Handle API errors with specific error code handling
   */
  static handleApiError(error: ApiError, customMessage?: string) {
    const { code, message, status } = error

    // Handle specific error codes
    switch (code) {
      case 'UNAUTHORIZED':
        this.handleUnauthorized()
        break
      
      case 'FORBIDDEN':
        this.handleForbidden()
        break
      
      case 'VALIDATION_ERROR':
        this.handleValidationError(error)
        break
      
      case 'NOT_FOUND':
        this.handleNotFound()
        break
      
      case 'CONFLICT':
        this.handleConflict()
        break
      
      case 'RATE_LIMITED':
        this.handleRateLimited()
        break
      
      case 'INTERNAL_ERROR':
        this.handleInternalError()
        break
      
      default:
        this.handleGenericError(message, customMessage)
    }

    // Log error for debugging
    console.error('API Error:', {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Handle unauthorized errors (401)
   */
  private static handleUnauthorized() {
    // Clear auth state
    store.dispatch(logout())
    
    // Show error message
    store.dispatch(addToast({
      message: 'Your session has expired. Please log in again.',
      severity: 'error',
      duration: 5000,
    }))

    // Redirect to login (you might want to use a router here)
    // window.location.href = '/login'
  }

  /**
   * Handle forbidden errors (403)
   */
  private static handleForbidden() {
    store.dispatch(addToast({
      message: 'You do not have permission to perform this action.',
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle validation errors (400)
   */
  private static handleValidationError(error: ApiError) {
    let message = 'Please check your input and try again.'
    
    if (error.details && typeof error.details === 'object') {
      const validationErrors = Object.values(error.details).flat()
      if (validationErrors.length > 0) {
        message = validationErrors.join(', ')
      }
    }

    store.dispatch(addToast({
      message,
      severity: 'error',
      duration: 6000,
    }))
  }

  /**
   * Handle not found errors (404)
   */
  private static handleNotFound() {
    store.dispatch(addToast({
      message: 'The requested resource was not found.',
      severity: 'error',
      duration: 4000,
    }))
  }

  /**
   * Handle conflict errors (409)
   */
  private static handleConflict() {
    store.dispatch(addToast({
      message: 'This resource already exists or conflicts with existing data.',
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle rate limit errors (429)
   */
  private static handleRateLimited() {
    store.dispatch(addToast({
      message: 'Too many requests. Please wait a moment and try again.',
      severity: 'warning',
      duration: 5000,
    }))
  }

  /**
   * Handle internal server errors (500)
   */
  private static handleInternalError() {
    store.dispatch(addToast({
      message: 'A server error occurred. Please try again later.',
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(originalMessage: string, customMessage?: string) {
    store.dispatch(addToast({
      message: customMessage || originalMessage || 'An unexpected error occurred.',
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle network errors
   */
  static handleNetworkError() {
    store.dispatch(addToast({
      message: 'Network error. Please check your connection and try again.',
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle timeout errors
   */
  static handleTimeoutError() {
    store.dispatch(addToast({
      message: 'Request timed out. Please try again.',
      severity: 'warning',
      duration: 4000,
    }))
  }

  /**
   * Handle offline errors
   */
  static handleOfflineError() {
    store.dispatch(addToast({
      message: 'You appear to be offline. Please check your connection.',
      severity: 'warning',
      duration: 5000,
    }))
  }

  /**
   * Handle file upload errors
   */
  static handleFileUploadError(error: any) {
    let message = 'File upload failed. Please try again.'
    
    if (error.message) {
      if (error.message.includes('size')) {
        message = 'File is too large. Please choose a smaller file.'
      } else if (error.message.includes('type')) {
        message = 'Invalid file type. Please choose a supported file format.'
      } else if (error.message.includes('network')) {
        message = 'Network error during upload. Please try again.'
      }
    }

    store.dispatch(addToast({
      message,
      severity: 'error',
      duration: 5000,
    }))
  }

  /**
   * Handle batch operation errors
   */
  static handleBatchError(successCount: number, totalCount: number, operation: string) {
    const failedCount = totalCount - successCount
    
    if (failedCount === 0) {
      store.dispatch(addToast({
        message: `All ${totalCount} items ${operation} successfully.`,
        severity: 'success',
        duration: 4000,
      }))
    } else if (successCount === 0) {
      store.dispatch(addToast({
        message: `Failed to ${operation} any items. Please try again.`,
        severity: 'error',
        duration: 5000,
      }))
    } else {
      store.dispatch(addToast({
        message: `${successCount} of ${totalCount} items ${operation} successfully. ${failedCount} failed.`,
        severity: 'warning',
        duration: 6000,
      }))
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ApiError): boolean {
    return error.status >= 500 || error.code === 'RATE_LIMITED'
  }

  /**
   * Get retry delay for exponential backoff
   */
  static getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000) // Max 30 seconds
  }

  /**
   * Format error for logging
   */
  static formatErrorForLogging(error: any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack}`
    }
    
    if (typeof error === 'object') {
      return JSON.stringify(error, null, 2)
    }
    
    return String(error)
  }
}
