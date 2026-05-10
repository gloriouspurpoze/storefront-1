import { api } from './base'

const silent = { showSuccessToast: false, showLoading: false } as const

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

export interface SupportTicketUserRef {
  _id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface SupportTicketMessage {
  senderType: 'user' | 'admin' | 'system'
  message: string
  createdAt: string
  attachments?: string[]
  senderId?: SupportTicketUserRef | string
}

export interface SupportTicketInternalNote {
  message: string
  createdAt: string
  authorId?: SupportTicketUserRef | string
}

export interface SupportTicketRow {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  category: string
  priority?: string
  userType?: string
  createdAt: string
  updatedAt?: string
  userId?: SupportTicketUserRef
  assignedTo?: SupportTicketUserRef | null
  slaDueAt?: string
  firstResponseAt?: string
  internalNotes?: SupportTicketInternalNote[]
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
  messages?: SupportTicketMessage[]
  metadata?: Record<string, unknown>
}

export type SupportTicketDetail = SupportTicketRow & {
  messages: SupportTicketMessage[]
}

export type SupportTicketsPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SupportStats {
  total: number
  byStatus: Array<{ _id: string; count: number }>
  byCategory: Array<{ _id: string; count: number }>
}

export type ListTicketsParams = {
  page?: number
  limit?: number
  status?: string
  category?: string
  priority?: string
  userType?: string
  search?: string
  hasRefund?: boolean
  refundStatus?: string
}

export class SupportTicketsService {
  static async listTicketQueue(params?: ListTicketsParams) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit ?? 50))
    if (params?.status) q.set('status', params.status)
    if (params?.category) q.set('category', params.category)
    if (params?.priority) q.set('priority', params.priority)
    if (params?.userType) q.set('userType', params.userType)
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.hasRefund) q.set('hasRefund', 'true')
    if (params?.refundStatus) q.set('refundStatus', params.refundStatus)
    const qs = q.toString()
    return api.get<{ tickets: SupportTicketRow[]; pagination: SupportTicketsPagination }>(
      `/feedback-support/support/tickets${qs ? `?${qs}` : ''}`,
      silent,
    )
  }

  static async getTicket(ticketId: string) {
    return api.get<SupportTicketDetail>(`/feedback-support/support/tickets/${ticketId}`, silent)
  }

  static async updateTicket(
    ticketId: string,
    body: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      assignedTo?: string | null
    },
  ) {
    return api.patch<SupportTicketDetail>(`/feedback-support/support/tickets/${ticketId}`, body, {
      ...silent,
      successMessage: 'Ticket updated',
    })
  }

  static async appendInternalNote(ticketId: string, body: { message: string }) {
    return api.post<SupportTicketDetail>(
      `/feedback-support/support/tickets/${ticketId}/internal-notes`,
      body,
      {
        ...silent,
        successMessage: 'Internal note added',
      },
    )
  }

  static async replyToTicket(ticketId: string, body: { message: string; attachments?: string[] }) {
    return api.post<SupportTicketDetail>(`/feedback-support/support/tickets/${ticketId}/reply`, body, {
      successMessage: 'Reply sent',
    })
  }

  static async closeTicket(ticketId: string) {
    return api.put<SupportTicketDetail>(
      `/feedback-support/support/tickets/${ticketId}/close`,
      {},
      { successMessage: 'Ticket closed' },
    )
  }

  static async getStats() {
    return api.get<SupportStats>(`/feedback-support/support/stats`, silent)
  }

  static async listRefundQueue(params?: { page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams()
    q.set('hasRefund', 'true')
    q.set('refundStatus', params?.status ?? 'pending')
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit ?? 50))
    return api.get<{ tickets: SupportTicketRow[]; pagination: unknown }>(
      `/feedback-support/support/tickets?${q.toString()}`,
      silent,
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
