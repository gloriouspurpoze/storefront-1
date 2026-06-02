import type { ApiClient } from '../types'
import type { PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export interface InvoiceCustomerRef {
  _id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'
export type InvoicePaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded'

export interface InvoiceRow {
  _id: string
  invoiceNumber: string
  bookingId?: string
  orderId?: string
  customerId?: InvoiceCustomerRef | string
  items?: InvoiceLineItem[]
  subtotal?: number
  tax?: number
  discount?: number
  totalAmount: number
  status: InvoiceStatus
  paymentStatus: InvoicePaymentStatus
  issuedDate?: string
  dueDate?: string
  paidDate?: string
  pdfUrl?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface InvoicesListResponse {
  invoices: InvoiceRow[]
  pagination: PaginationResponse
}

export interface InvoicesQuery {
  page?: number
  limit?: number
  status?: InvoiceStatus
  customerId?: string
  search?: string
}

function defaultPagination(): PaginationResponse {
  return { page: 1, limit: 25, total: 0, totalPages: 0 }
}

function normalizeList(raw: unknown): InvoicesListResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    return {
      invoices: data as InvoiceRow[],
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const invoices = (Array.isArray(d.invoices) ? d.invoices : []) as InvoiceRow[]
    const pagination = (d.pagination as PaginationResponse | undefined) ?? {
      page: 1,
      limit: invoices.length,
      total: invoices.length,
      totalPages: 1,
    }
    return { invoices, pagination }
  }
  return { invoices: [], pagination: defaultPagination() }
}

export function createInvoicesService(api: ApiClient) {
  return {
    /**
     * Admin invoices list. Tries `/invoices/admin/all` first then falls back to
     * legacy `/invoices` shapes that older fixer-backend versions expose.
     */
    async getInvoices(query: InvoicesQuery = {}): Promise<InvoicesListResponse> {
      const endpoints = ['/invoices/admin/all', '/invoices', '/invoices/admin']
      let lastError: unknown
      for (const endpoint of endpoints) {
        try {
          const res = await api.get<unknown>(endpoint, {
            params: query as Record<string, unknown>,
          })
          return normalizeList(res.data ?? res)
        } catch (e) {
          lastError = e
          const status = (e as { status?: number } | null)?.status
          if (status !== 404) break
        }
      }
      throw lastError ?? new Error('Could not load invoices')
    },
    async getInvoice(id: string): Promise<InvoiceRow> {
      const res = await api.get<unknown>(`/invoices/${id}`)
      const data = unwrapApiData<unknown>(res.data ?? res)
      if (data && typeof data === 'object' && 'invoice' in (data as Record<string, unknown>)) {
        return (data as { invoice: InvoiceRow }).invoice
      }
      return data as InvoiceRow
    },
    async cancelInvoice(id: string): Promise<InvoiceRow> {
      const res = await api.post<unknown>(`/invoices/${id}/cancel`, {})
      return unwrapApiData<InvoiceRow>(res.data ?? res)
    },
    async markInvoicePaid(id: string, paymentMethod = 'cash'): Promise<InvoiceRow> {
      const res = await api.post<unknown>(`/invoices/${id}/mark-paid`, { paymentMethod })
      return unwrapApiData<InvoiceRow>(res.data ?? res)
    },
  }
}

export type InvoicesService = ReturnType<typeof createInvoicesService>
