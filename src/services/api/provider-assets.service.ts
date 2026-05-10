import { api } from './base'
import type {
  ProviderAssetDto,
  ProviderAssetListResponse,
  ProviderAssetRequestListResponse,
} from '../../types/provider-assets.types'

const silent = { showSuccessToast: false, showLoading: false } as const

export class ProviderAssetsService {
  static list(params?: {
    page?: number
    limit?: number
    search?: string
    professionalId?: string
    category?: string
    status?: string
    includeArchived?: boolean
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.professionalId?.trim()) q.set('professionalId', params.professionalId.trim())
    if (params?.category?.trim()) q.set('category', params.category.trim())
    if (params?.status?.trim()) q.set('status', params.status.trim())
    if (params?.includeArchived) q.set('includeArchived', 'true')
    const qs = q.toString()
    return api.get<ProviderAssetListResponse>(`/provider-assets${qs ? `?${qs}` : ''}`, silent)
  }

  static listRequests(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status?.trim()) q.set('status', params.status.trim())
    if (params?.search?.trim()) q.set('search', params.search.trim())
    const qs = q.toString()
    return api.get<ProviderAssetRequestListResponse>(
      `/provider-assets/requests${qs ? `?${qs}` : ''}`,
      silent,
    )
  }

  static approveRequest(id: string, body: Record<string, unknown>) {
    return api.post<{ request: unknown; asset: ProviderAssetDto }>(
      `/provider-assets/requests/${id}/approve`,
      body,
      {
        successMessage: 'Request approved — asset registered.',
        loadingMessage: 'Approving…',
      },
    )
  }

  static rejectRequest(id: string, body: Record<string, unknown>) {
    return api.post(`/provider-assets/requests/${id}/reject`, body, {
      successMessage: 'Request rejected.',
      loadingMessage: 'Saving…',
    })
  }

  static getById(id: string) {
    return api.get<ProviderAssetDto>(`/provider-assets/${id}`, silent)
  }

  static create(body: Record<string, unknown>) {
    return api.post<ProviderAssetDto>('/provider-assets', body, {
      successMessage: 'Asset registered.',
      loadingMessage: 'Saving…',
    })
  }

  static patch(id: string, body: Record<string, unknown>) {
    return api.patch<ProviderAssetDto>(`/provider-assets/${id}`, body, {
      successMessage: 'Asset updated.',
      loadingMessage: 'Saving…',
    })
  }

  static archive(id: string) {
    return api.post<ProviderAssetDto>(`/provider-assets/${id}/archive`, {}, {
      successMessage: 'Asset archived.',
      loadingMessage: 'Archiving…',
    })
  }
}
