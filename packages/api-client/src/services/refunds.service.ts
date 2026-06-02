import type { ApiClient } from '../types'
import type { PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface RefundRequestEmbed {
  bookingId?: string
  paymentId?: string
  amountRequested?: number
  currency?: string
  status?: RefundStatus
  rejectionReason?: string
  adminNote?: string
  reviewedAt?: string
}

export interface RefundTicketRow {
  _id: string
  ticketNumber: string
  subject: string
  description?: string
  status: string
  category: string
  priority?: string
  createdAt: string
  userId?: { firstName?: string; lastName?: string; email?: string; phone?: string }
  refundRequest?: RefundRequestEmbed
  refundRequestPopulated?: {
    bookingId?: {
      _id?: string
      status?: string
      totalAmount?: number
      paymentStatus?: string
      scheduledDate?: string
    }
  }
}

export interface RefundQueueResponse {
  tickets: RefundTicketRow[]
  pagination: PaginationResponse
}

function normalizeQueue(raw: unknown): RefundQueueResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    return {
      tickets: data as RefundTicketRow[],
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const tickets = (Array.isArray(d.tickets) ? d.tickets : []) as RefundTicketRow[]
    const pagination = (d.pagination as PaginationResponse | undefined) ?? {
      page: 1,
      limit: tickets.length,
      total: tickets.length,
      totalPages: 1,
    }
    return { tickets, pagination }
  }
  return { tickets: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } }
}

export function createRefundsService(api: ApiClient) {
  const base = '/feedback-support/support/tickets'
  return {
    async getQueue(params: { status?: RefundStatus; page?: number; limit?: number } = {}): Promise<RefundQueueResponse> {
      const res = await api.get<unknown>(base, {
        params: {
          hasRefund: 'true',
          refundStatus: params.status ?? 'pending',
          page: params.page,
          limit: params.limit ?? 25,
        },
      })
      return normalizeQueue(res.data ?? res)
    },
    async getTicket(ticketId: string): Promise<RefundTicketRow> {
      const res = await api.get<unknown>(`${base}/${ticketId}`)
      return unwrapApiData<RefundTicketRow>(res.data ?? res)
    },
    async approveRefund(ticketId: string, body: { adminNote?: string; amount?: number } = {}): Promise<RefundTicketRow> {
      const res = await api.post<unknown>(`${base}/${ticketId}/refund/approve`, body)
      return unwrapApiData<RefundTicketRow>(res.data ?? res)
    },
    async rejectRefund(ticketId: string, body: { rejectionReason: string; adminNote?: string }): Promise<RefundTicketRow> {
      const res = await api.post<unknown>(`${base}/${ticketId}/refund/reject`, body)
      return unwrapApiData<RefundTicketRow>(res.data ?? res)
    },
  }
}

export type RefundsService = ReturnType<typeof createRefundsService>
