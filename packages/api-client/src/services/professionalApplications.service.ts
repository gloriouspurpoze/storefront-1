import type { ApiClient } from '../types'

export type ProfessionalApplicationStatus =
  | 'new'
  | 'contacted'
  | 'approved'
  | 'rejected'
  | 'archived'

export interface ProfessionalApplication {
  _id: string
  applicationId: string
  fullName: string
  phone: string
  email?: string
  city: string
  status: ProfessionalApplicationStatus
  source: string
  createdAt: string
  updatedAt: string
}

export function createProfessionalApplicationsService(api: ApiClient) {
  return {
    getList: (params?: {
      page?: number
      limit?: number
      status?: ProfessionalApplicationStatus
      search?: string
      city?: string
    }) =>
      api.get<ProfessionalApplication[] | { data: ProfessionalApplication[] }>(
        '/professional-applications',
        { params: params as Record<string, unknown> },
      ),
    getById: (id: string) => api.get<ProfessionalApplication>(`/professional-applications/${id}`),
    updateStatus: (
      id: string,
      payload: { status: ProfessionalApplicationStatus; adminNotes?: string },
    ) =>
      api.patch<ProfessionalApplication>(`/professional-applications/${id}/status`, payload),
  }
}

export type ProfessionalApplicationsService = ReturnType<typeof createProfessionalApplicationsService>
