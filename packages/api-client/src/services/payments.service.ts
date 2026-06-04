import type { ApiClient } from '../types'
import type { PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export interface PaymentRow {
  _id?: string
  id?: string
  bookingId?: string
  orderId?: string
  customerId?: string | { firstName?: string; lastName?: string; email?: string }
  amount: number
  currency?: string
  status: PaymentStatus
  paymentMethod?: string
  transactionId?: string
  refundAmount?: number
  refundReason?: string
  createdAt: string
  updatedAt?: string
}

export interface PaymentsListResponse {
  payments: PaymentRow[]
  pagination: PaginationResponse
}

export interface PaymentsQuery {
  page?: number
  limit?: number
  status?: string
  bookingId?: string
  customerId?: string
  search?: string
}

function normalizeList(raw: unknown): PaymentsListResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    return {
      payments: data as PaymentRow[],
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const payments = (Array.isArray(d.payments) ? d.payments : []) as PaymentRow[]
    const pagination = (d.pagination as PaginationResponse | undefined) ?? {
      page: 1,
      limit: payments.length,
      total: payments.length,
      totalPages: 1,
    }
    return { payments, pagination }
  }
  return { payments: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } }
}

/** Backend wraps single records as `{ payment: {...} }`. Unwrap to the row. */
function unwrapPayment(raw: unknown): PaymentRow {
  const data = unwrapApiData<Record<string, unknown>>(raw)
  if (data && typeof data === 'object' && 'payment' in data) {
    return (data as { payment: PaymentRow }).payment
  }
  return data as PaymentRow
}

export function createPaymentsService(api: ApiClient) {
  return {
    async getPayments(query: PaymentsQuery = {}): Promise<PaymentsListResponse> {
      const params = { ...query } as Record<string, unknown>
      if (params.bookingId) {
        params.booking_id = params.bookingId
        delete params.bookingId
      }
      if (params.customerId) {
        params.customer_id = params.customerId
        delete params.customerId
      }
      const res = await api.get<unknown>('/payments', { params })
      return normalizeList(res.data ?? res)
    },
    async getPayment(id: string): Promise<PaymentRow> {
      const res = await api.get<unknown>(`/payments/${id}`)
      return unwrapPayment(res.data ?? res)
    },
    async refundPayment(id: string, payload: { amount?: number; reason?: string }): Promise<PaymentRow> {
      const res = await api.post<unknown>(`/payments/${id}/refund`, payload)
      return unwrapPayment(res.data ?? res)
    },
    async cancelPayment(id: string, reason?: string): Promise<PaymentRow> {
      const res = await api.post<unknown>(`/payments/${id}/cancel`, { reason })
      return unwrapPayment(res.data ?? res)
    },
  }
}

export type PaymentsService = ReturnType<typeof createPaymentsService>
