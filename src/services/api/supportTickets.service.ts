import { api } from './base'

export interface RefundRequestEmbed {
  bookingId?: string
  paymentId?: string
  amountRequested?: number
  currency?: string
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  rejectionReason?: string
  adminNote?: string
  reviewedAt?: string
  fallbackLedgerOnly?: boolean
}

export interface SupportTicketRow {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  category: string
  priority?: string
  createdAt: string
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string }
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

export class SupportTicketsService {
  static async listRefundQueue(params?: { page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams()
    q.set('hasRefund', 'true')
    q.set('refundStatus', params?.status ?? 'pending')
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit ?? 50))
    return api.get<{ tickets: SupportTicketRow[]; pagination: unknown }>(
      `/feedback-support/support/tickets?${q.toString()}`,
      { showSuccessToast: false },
    )
  }

  static async approveRefund(ticketId: string, body: { adminNote?: string; amount?: number }) {
    return api.post<SupportTicketRow>(`/feedback-support/support/tickets/${ticketId}/refund/approve`, body, {
      successMessage: 'Refund processed',
    })
  }

  static async rejectRefund(ticketId: string, body: { rejectionReason: string; adminNote?: string }) {
    return api.post<SupportTicketRow>(`/feedback-support/support/tickets/${ticketId}/refund/reject`, body, {
      successMessage: 'Refund request rejected',
    })
  }
}
