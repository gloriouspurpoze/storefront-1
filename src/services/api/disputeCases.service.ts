import { api } from './base'

export type DisputeCaseStatus =
  | 'open'
  | 'investigating'
  | 'awaiting_customer'
  | 'awaiting_pro'
  | 'resolved'
  | 'closed'
  | 'escalated'

export type DisputePartyRole = 'customer' | 'professional' | 'provider' | 'platform' | 'admin'

export interface DisputeParty {
  role: DisputePartyRole
  userId?: string
  displayName?: string
  phone?: string
  email?: string
}

export interface DisputeAuditEntry {
  at: string
  actorUserId: string
  actorLabel?: string
  action: string
  note?: string
  meta?: Record<string, unknown>
}

export interface DisputeCaseRow {
  _id: string
  disputeCaseNumber: string
  title: string
  description: string
  status: DisputeCaseStatus
  priority: string
  bookingId?: unknown
  parties: DisputeParty[]
  evidenceUrls: string[]
  slaDueAt: string
  slaBreachedAt?: string
  slaBreachedComputed?: boolean
  assignedTo?: unknown
  auditLog: DisputeAuditEntry[]
  createdBy?: unknown
  createdAt: string
  updatedAt: string
}

export interface DisputeCasesListResponse {
  cases: DisputeCaseRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export class DisputeCasesService {
  static async list(params?: {
    page?: number
    limit?: number
    status?: DisputeCaseStatus
    bookingId?: string
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    if (params?.bookingId) q.set('bookingId', params.bookingId)
    const qs = q.toString()
    return api.get<DisputeCasesListResponse>(`/dispute-cases${qs ? `?${qs}` : ''}`, {
      showSuccessToast: false,
    })
  }

  static async getById(id: string) {
    return api.get<DisputeCaseRow>(`/dispute-cases/${id}`, { showSuccessToast: false })
  }

  static async create(body: {
    title: string
    description: string
    bookingId?: string
    priority?: string
    parties?: DisputeParty[]
    evidenceUrls?: string[]
    slaDueAt?: string
  }) {
    return api.post<DisputeCaseRow>('/dispute-cases', body, {
      successMessage: 'Dispute case created',
    })
  }

  static async patch(
    id: string,
    body: Partial<{
      title: string
      description: string
      status: DisputeCaseStatus
      priority: string
      parties: DisputeParty[]
      evidenceUrls: string[]
      slaDueAt: string
      assignedTo: string | null
    }>,
  ) {
    return api.patch<DisputeCaseRow>(`/dispute-cases/${id}`, body, {
      successMessage: 'Case updated',
    })
  }

  static async appendAudit(id: string, body: { action: string; note?: string; meta?: Record<string, unknown> }) {
    return api.post<DisputeCaseRow>(`/dispute-cases/${id}/audit`, body, {
      successMessage: 'Audit logged',
    })
  }
}
