import { api } from './base'
import type {
  ProfessionalConductRecordDto,
  ProfessionalConductListResponse,
} from '../../types/professional-conduct.types'

const silent = { showSuccessToast: false, showLoading: false } as const

export class ProfessionalConductService {
  static list(params?: {
    page?: number
    limit?: number
    professionalId?: string
    actionType?: string
    status?: string
    search?: string
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.professionalId?.trim()) q.set('professionalId', params.professionalId.trim())
    if (params?.actionType?.trim()) q.set('actionType', params.actionType.trim())
    if (params?.status?.trim()) q.set('status', params.status.trim())
    if (params?.search?.trim()) q.set('search', params.search.trim())
    const qs = q.toString()
    return api.get<ProfessionalConductListResponse>(
      `/professional-conduct${qs ? `?${qs}` : ''}`,
      silent,
    )
  }

  static create(body: Record<string, unknown>) {
    return api.post<ProfessionalConductRecordDto>('/professional-conduct', body, {
      successMessage: 'Conduct record saved.',
      loadingMessage: 'Saving…',
    })
  }

  static patch(id: string, body: Record<string, unknown>) {
    return api.patch<ProfessionalConductRecordDto>(`/professional-conduct/${id}`, body, {
      successMessage: 'Record updated.',
      loadingMessage: 'Updating…',
    })
  }

  static getById(id: string) {
    return api.get<ProfessionalConductRecordDto>(`/professional-conduct/${id}`, silent)
  }
}
