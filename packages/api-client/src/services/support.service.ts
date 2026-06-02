import type { ApiClient } from '../types'

export interface SupportTicketRow {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  category: string
  priority?: string
  createdAt: string
  userId?: { firstName?: string; lastName?: string; email?: string }
  refundRequest?: { status?: string; amountRequested?: number }
}

export interface SupportTicketsListResponse {
  tickets: SupportTicketRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type ListTicketsParams = {
  page?: number
  limit?: number
  status?: string
  hasRefund?: boolean
  refundStatus?: string
  search?: string
}

export function createSupportService(api: ApiClient) {
  return {
    listTickets: (params?: ListTicketsParams) =>
      api.get<SupportTicketsListResponse>('/feedback-support/support/tickets', {
        params: params as Record<string, unknown>,
      }),
    getTicket: (ticketId: string) =>
      api.get<SupportTicketRow>(`/feedback-support/support/tickets/${ticketId}`),
    listRefundRequests: (params?: ListTicketsParams) =>
      api.get<SupportTicketsListResponse>('/feedback-support/support/tickets', {
        params: { ...params, hasRefund: true } as Record<string, unknown>,
      }),
    updateTicket: (
      ticketId: string,
      body: {
        status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
        priority?: 'low' | 'medium' | 'high' | 'urgent'
        assignedTo?: string | null
      },
    ) => api.patch<SupportTicketRow>(`/feedback-support/support/tickets/${ticketId}`, body),
    closeTicket: (ticketId: string) =>
      api.put<SupportTicketRow>(`/feedback-support/support/tickets/${ticketId}/close`, {}),
  }
}

export type SupportService = ReturnType<typeof createSupportService>
