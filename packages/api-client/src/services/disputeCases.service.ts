import type { ApiClient } from '../types'

export type DisputeCaseStatus =
  | 'open'
  | 'investigating'
  | 'awaiting_customer'
  | 'awaiting_pro'
  | 'resolved'
  | 'closed'
  | 'escalated'

export interface DisputeCaseRow {
  _id: string
  disputeCaseNumber: string
  title: string
  description: string
  status: DisputeCaseStatus
  priority: string
  createdAt: string
  updatedAt: string
}

export interface DisputeCasesListResponse {
  cases: DisputeCaseRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function createDisputeCasesService(api: ApiClient) {
  return {
    list: (params?: { page?: number; limit?: number; status?: DisputeCaseStatus }) =>
      api.get<DisputeCasesListResponse>('/dispute-cases', { params: params as Record<string, unknown> }),
    getById: (id: string) => api.get<DisputeCaseRow>(`/dispute-cases/${id}`),
  }
}

export type DisputeCasesService = ReturnType<typeof createDisputeCasesService>
