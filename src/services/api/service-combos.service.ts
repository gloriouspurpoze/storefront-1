import { api } from './base'

const silent = { showSuccessToast: false, showLoading: false } as const

export interface ServiceComboLine {
  serviceId: string
  variantId?: string
  quantity: number
  sortOrder?: number
  serviceName?: string
  unitPrice?: number
  lineTotal?: number
}

export interface ServiceComboDto {
  id: string
  name: string
  slug: string
  shortDescription?: string
  badge?: string
  image?: string
  categorySlug?: string
  categoryId?: string | null
  items: ServiceComboLine[]
  lines?: ServiceComboLine[]
  pricingMode: 'percent_off_catalog' | 'fixed_price' | 'flat_off_catalog'
  percentOff?: number
  fixedPrice?: number
  flatOff?: number
  isActive: boolean
  sortOrder: number
  catalogSubtotal?: number
  bundlePrice?: number
  savings?: number
  savingsPercent?: number
}

export interface ServiceComboPayload {
  name: string
  slug?: string
  shortDescription?: string
  badge?: string
  image?: string
  categorySlug?: string
  categoryId?: string
  items: Array<{ serviceId: string; variantId?: string; quantity?: number; sortOrder?: number }>
  pricingMode: ServiceComboDto['pricingMode']
  percentOff?: number
  fixedPrice?: number
  flatOff?: number
  isActive?: boolean
  sortOrder?: number
}

export class ServiceCombosService {
  static list(params?: { page?: number; limit?: number; search?: string }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    const qs = q.toString()
    return api.get<{ combos: ServiceComboDto[]; pagination: { total: number } }>(
      `/service-combos${qs ? `?${qs}` : ''}`,
      silent,
    )
  }

  static getById(id: string) {
    return api.get<ServiceComboDto>(`/service-combos/${id}`, silent)
  }

  static create(body: ServiceComboPayload) {
    return api.post<ServiceComboDto>('/service-combos', body, {
      successMessage: 'Bundle created.',
      loadingMessage: 'Creating bundle…',
    })
  }

  static update(id: string, body: Partial<ServiceComboPayload>) {
    return api.put<ServiceComboDto>(`/service-combos/${id}`, body, {
      successMessage: 'Bundle updated.',
    })
  }

  static delete(id: string) {
    return api.delete<void>(`/service-combos/${id}`, {
      successMessage: 'Bundle removed.',
    })
  }
}
