import { api } from './base'
import type {
  OperatingCityDto,
  OperatingCityListResponse,
  TenantCommercialTermsDto,
} from '../../types/operating-commercial.types'

const silent = { showSuccessToast: false, showLoading: false } as const

export class OperationsCommercialService {
  static getTerms() {
    return api.get<TenantCommercialTermsDto>('/operations-commercial/terms', silent)
  }

  static patchTerms(body: Record<string, unknown>) {
    return api.patch<TenantCommercialTermsDto>('/operations-commercial/terms', body, {
      successMessage: 'Commercial terms saved.',
      loadingMessage: 'Saving…',
    })
  }

  static listCities(params?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.activeOnly) q.set('activeOnly', 'true')
    const qs = q.toString()
    return api.get<OperatingCityListResponse>(`/operations-commercial/cities${qs ? `?${qs}` : ''}`, silent)
  }

  static createCity(body: Record<string, unknown>) {
    return api.post<OperatingCityDto>('/operations-commercial/cities', body, {
      successMessage: 'City added.',
      loadingMessage: 'Saving…',
    })
  }

  static patchCity(id: string, body: Record<string, unknown>) {
    return api.patch<OperatingCityDto>(`/operations-commercial/cities/${id}`, body, {
      successMessage: 'City updated.',
    })
  }

  static archiveCity(id: string) {
    return api.post<OperatingCityDto>(`/operations-commercial/cities/${id}/archive`, {}, {
      successMessage: 'City archived.',
    })
  }
}
