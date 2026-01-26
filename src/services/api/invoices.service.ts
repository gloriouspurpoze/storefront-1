/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

import { api } from './base'
import type { PaginationResponse } from '../../types'

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
   * Generate invoice
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
   * Download invoice PDF
   */
  static async downloadInvoicePDF(invoiceId: string) {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8005/api'}/invoices/${invoiceId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to download invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
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

