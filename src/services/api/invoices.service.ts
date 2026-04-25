/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

import { api } from './base'
import { store } from '../../store'
import type { PaginationResponse } from '../../types'

/** Same base URL as `api` (used for PDF blob fetch — fetch() does not go through ApiBase). */
export function getInvoiceApiBaseUrl(): string {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
  return base.replace(/\/$/, '')
}

export interface ManualInvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  category?: string
}

export interface ManualInvoicePayload {
  type: 'service' | 'product' | 'subscription' | 'provider_payout'
  customerId: string
  billingTo: {
    name: string
    phone: string
    email?: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    gstin?: string
  }
  items: ManualInvoiceLineItem[]
  discount?: number
  creditsUsed?: number
  paymentMethod?: string
  orderId?: string
  bookingId?: string
  notes?: string
}

export interface Invoice {
  _id: string
  invoiceNumber: string
  bookingId?: string
  orderId?: string
  customerId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  providerId?: {
    _id: string
    businessName: string
    email: string
    phone?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  subtotal: number
  tax: number
  discount: number
  totalAmount: number
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded'
  issuedDate: string
  dueDate?: string
  paidDate?: string
  pdfUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceResponse {
  success: boolean
  message?: string
  data?: {
    invoice: Invoice
  }
  error?: string
}

export interface InvoicesResponse {
  invoices: Invoice[]
  pagination?: PaginationResponse
  success?: boolean
  message?: string
  data?: {
    invoices: Invoice[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
}

export interface MonthlyReportResponse {
  success: boolean
  message?: string
  data?: {
    report: {
      period: string
      totalRevenue: number
      totalInvoices: number
      paidInvoices: number
      pendingInvoices: number
      averageInvoiceValue: number
      topCustomers: Array<{
        customerId: string
        customerName: string
        totalSpent: number
        invoiceCount: number
      }>
    }
  }
  error?: string
}

export class InvoicesService {
  /**
   * Get invoices (Admin-friendly)
   * Tries multiple endpoint patterns to support different backends.
   */
  static async getInvoices(query: {
    page?: number
    limit?: number
    status?: string
    customerId?: string
  } = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const qs = params.toString() ? `?${params.toString()}` : ''
    const endpoints = [
      `/invoices/admin/all${qs}`,
      `/invoices${qs}`,
      `/invoices/admin${qs}`,
      `/invoices/all${qs}`,
      `/invoices/list${qs}`,
      // Fallback: some backends only expose "my" invoices
      `/invoices/my-invoices${qs}`,
    ]

    let lastError: any = null

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const isLast = i === endpoints.length - 1
      try {
        const res = await api.get<InvoicesResponse>(endpoint, {
          loadingMessage: i === 0 ? 'Loading invoices...' : undefined,
          showSuccessToast: false,
          showErrorToast: false,
          showLoading: i === 0,
        })

        if (res?.success) return res
      } catch (err: any) {
        lastError = err
        const status = err?.status || err?.response?.status
        const is404 = status === 404
        if (!is404 || isLast) break
      }
    }

    throw lastError || new Error('Failed to load invoices')
  }

  /**
   * Get customer invoices
   */
  static async getCustomerInvoices(query: {
    page?: number
    limit?: number
    status?: string
    customerId?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return api.get<InvoicesResponse>(
      `/invoices/my-invoices${params.toString() ? `?${params.toString()}` : ''}`,
      {
        loadingMessage: 'Loading invoices...',
        showSuccessToast: false,
      }
    )
  }

  /**
   * Get provider payout statements
   */
  static async getProviderPayouts(query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return api.get<InvoicesResponse>(
      `/invoices/my-payouts${params.toString() ? `?${params.toString()}` : ''}`,
      {
        loadingMessage: 'Loading payout statements...',
        showSuccessToast: false,
      }
    )
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string) {
    return api.get<InvoiceResponse>(`/invoices/${invoiceId}`, {
      loadingMessage: 'Loading invoice...',
      showSuccessToast: false,
    })
  }

  /**
   * Get invoice by booking ID
   */
  static async getInvoiceByBookingId(bookingId: string) {
    return api.get<InvoiceResponse>(`/invoices/booking/${bookingId}`, {
      loadingMessage: 'Loading invoice...',
      showSuccessToast: false,
    })
  }

  /**
   * Get invoice by order ID
   */
  static async getInvoiceByOrderId(orderId: string) {
    return api.get<InvoiceResponse>(`/invoices/order/${orderId}`, {
      loadingMessage: 'Loading invoice...',
      showSuccessToast: false,
    })
  }

  /**
   * Generate invoice for an existing booking (admin / ops)
   */
  static async generateInvoiceForBooking(
    bookingId: string,
    options?: { showSuccessToast?: boolean; showLoading?: boolean; loadingMessage?: string }
  ) {
    return api.post<InvoiceResponse>(
      `/invoices/generate-for-booking/${encodeURIComponent(bookingId)}`,
      {},
      {
        loadingMessage: options?.loadingMessage ?? 'Generating invoice…',
        showSuccessToast: options?.showSuccessToast !== false,
        showLoading: options?.showLoading !== false,
        successMessage: 'Invoice generated successfully.',
      }
    )
  }

  /**
   * Generate invoice (legacy shape)
   */
  static async generateInvoice(data: {
    bookingId?: string
    orderId?: string
    customerId: string
    items: Array<{
      description: string
      quantity: number
      unitPrice: number
    }>
    notes?: string
  }) {
    return api.post<InvoiceResponse>('/invoices/generate', data, {
      loadingMessage: 'Generating invoice...',
      successMessage: 'Invoice generated successfully!',
    })
  }

  /**
   * Admin: full manual invoice (matches fixer-backend InvoiceService.generateInvoice body).
   */
  static async generateInvoiceManual(payload: ManualInvoicePayload) {
    return api.post<Invoice>('/invoices/generate', payload, {
      loadingMessage: 'Creating invoice…',
      showSuccessToast: false,
      showErrorToast: true,
    })
  }

  /**
   * Download invoice PDF
   */
  static async downloadInvoicePDF(invoiceId: string, fileName?: string) {
    try {
      const base = getInvoiceApiBaseUrl()
      const token =
        store.getState().auth?.token ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null)
      if (!token) {
        throw new Error('Not signed in — open the invoice again after logging in.')
      }

      const response = await fetch(
        `${base}/invoices/${encodeURIComponent(invoiceId)}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        let msg = `Download failed (${response.status})`
        try {
          const j = JSON.parse(errText)
          if (j.message) msg = j.message
        } catch {
          if (errText) msg = errText.slice(0, 200)
        }
        throw new Error(msg)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (fileName || `invoice-${invoiceId}`).replace(/\.pdf$/i, '') + '.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true, message: 'Invoice downloaded successfully' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Download several invoice PDFs sequentially (browser may block many parallel downloads).
   * @param delayMs wait between each download to avoid rate limits / pop-up blockers
   */
  static async downloadInvoicePDFsBatch(
    entries: { id: string; fileNameBase?: string }[],
    options?: { delayMs?: number; onEach?: (index: number, id: string, ok: boolean, err?: string) => void }
  ): Promise<{ ok: number; fail: number; errors: string[] }> {
    const delayMs = options?.delayMs ?? 450
    let ok = 0
    let fail = 0
    const errors: string[] = []
    for (let i = 0; i < entries.length; i++) {
      const { id, fileNameBase } = entries[i]
      const r = await this.downloadInvoicePDF(id, fileNameBase)
      if (r.success) {
        ok++
        options?.onEach?.(i, id, true)
      } else {
        fail++
        const msg = (r as { error?: string }).error || 'Download failed'
        errors.push(`${id}: ${msg}`)
        options?.onEach?.(i, id, false, msg)
      }
      if (i < entries.length - 1) {
        await new Promise((res) => setTimeout(res, delayMs))
      }
    }
    return { ok, fail, errors }
  }

  /**
   * Regenerate invoice PDF
   */
  static async regenerateInvoicePDF(invoiceId: string) {
    return api.post<InvoiceResponse>(`/invoices/${invoiceId}/regenerate-pdf`, {}, {
      loadingMessage: 'Regenerating PDF...',
      successMessage: 'PDF regenerated successfully!',
    })
  }

  /**
   * Email invoice to customer
   */
  static async emailInvoiceToCustomer(invoiceId: string) {
    return api.post<InvoiceResponse>(`/invoices/${invoiceId}/email`, {}, {
      loadingMessage: 'Sending invoice...',
      successMessage: 'Invoice sent successfully!',
    })
  }

  /**
   * Email payout statement to provider
   */
  static async emailPayoutToProvider(invoiceId: string) {
    return api.post<InvoiceResponse>(`/invoices/${invoiceId}/email-payout`, {}, {
      loadingMessage: 'Sending payout statement...',
      successMessage: 'Payout statement sent successfully!',
    })
  }

  /**
   * Get monthly financial report
   */
  static async getMonthlyReport(year: number, month: number) {
    return api.get<MonthlyReportResponse>(
      `/invoices/reports/monthly?year=${year}&month=${month}`,
      {
        loadingMessage: 'Loading report...',
        showSuccessToast: false,
      }
    )
  }
}

