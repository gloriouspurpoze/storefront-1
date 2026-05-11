import { api } from './base'

export type ProfessionalApplicationStatus =
  | 'new'
  | 'contacted'
  | 'approved'
  | 'rejected'
  | 'archived'

export type ProfessionalApplicationSource = 'web' | 'admin' | 'import' | 'mobile_app'

export interface ProfessionalApplication {
  _id: string
  applicationId: string
  fullName: string
  phone: string
  email?: string
  city: string
  state?: string
  area?: string
  servicesInterested?: string[]
  experienceYears?: number
  message?: string
  status: ProfessionalApplicationStatus
  source: ProfessionalApplicationSource | string
  adminNotes?: string
  contactedAt?: string
  contactedBy?: string
  statusHistory?: Array<{
    status: ProfessionalApplicationStatus
    changedAt: string
    changedBy?: string
    notes?: string
  }>
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ProfessionalApplicationsQuery {
  page?: number
  limit?: number
  status?: ProfessionalApplicationStatus
  source?: ProfessionalApplicationSource
  search?: string
  city?: string
  fromDate?: string
  toDate?: string
}

export interface ProfessionalApplicationsListResponse {
  data: ProfessionalApplication[]
  meta?: {
    pagination?: { page: number; limit: number; total: number; totalPages: number }
    filters?: Record<string, unknown>
  }
}

export class ProfessionalApplicationsService {
  static async getList(query: ProfessionalApplicationsQuery = {}) {
    const params: Record<string, string | number> = {}
    if (query.page != null) params.page = query.page
    if (query.limit != null) params.limit = query.limit
    if (query.status) params.status = query.status
    if (query.source) params.source = query.source
    if (query.search) params.search = query.search
    if (query.city) params.city = query.city
    if (query.fromDate) params.fromDate = query.fromDate
    if (query.toDate) params.toDate = query.toDate

    return api.get<ProfessionalApplication[]>(`/professional-applications`, {
      params,
      loadingMessage: 'Loading applications...',
      showSuccessToast: false,
    })
  }

  static async getById(id: string) {
    return api.get<ProfessionalApplication>(`/professional-applications/${id}`, {
      loadingMessage: 'Loading application...',
      showSuccessToast: false,
    })
  }

  static async updateStatus(
    id: string,
    payload: { status: ProfessionalApplicationStatus; adminNotes?: string }
  ) {
    return api.patch<ProfessionalApplication>(`/professional-applications/${id}/status`, payload, {
      loadingMessage: 'Updating status...',
      successMessage: 'Status updated successfully',
      errorMessage: 'Failed to update status',
    })
  }
}
