import type { ApiClient } from '../types'
import { unwrapApiData, unwrapList } from '../unwrap'

export interface CatalogService {
  id: string
  name: string
  short_description?: string
  base_price?: number
  gst_percentage?: number
  service_type?: 'fixed' | 'hourly' | 'consultation'
}

export type ServiceType = 'fixed' | 'hourly' | 'consultation'

export interface CreatePlatformServicePayload {
  name: string
  description: string
  short_description?: string
  /** Category id (from categories.listCategories). */
  category?: string
  subcategory?: string
  service_type?: ServiceType
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  gst_percentage?: number
  duration?: string
  is_active?: boolean
  is_featured?: boolean
  image?: string
  tags?: string[]
}

export interface CreatedCatalogService {
  id: string
  name: string
}

export type ServiceStatus = 'draft' | 'published' | 'archived'

export interface ServiceListItem {
  id: string
  name: string
  status: ServiceStatus
  is_active: boolean
  service_type: ServiceType
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  category?: string
  image?: string
  total_bookings?: number
}

export interface ServiceListResult {
  items: ServiceListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ServiceListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ServiceStatus
  is_active?: boolean
  category?: string
  service_type?: ServiceType
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ServiceDetail {
  id: string
  name: string
  description: string
  short_description?: string
  category?: string
  service_type: ServiceType
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  gst_percentage?: number
  duration?: string
  image?: string
  is_active: boolean
  status: ServiceStatus
}

export type UpdatePlatformServicePayload = Partial<CreatePlatformServicePayload> & {
  is_active?: boolean
  status?: ServiceStatus
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

function mapServiceListItem(s: Record<string, unknown>): ServiceListItem {
  return {
    id: String(s.id ?? s._id ?? ''),
    name: String(s.name ?? 'Service'),
    status: (s.status as ServiceStatus) ?? 'draft',
    is_active: Boolean(s.is_active),
    service_type: (s.service_type as ServiceType) ?? 'fixed',
    base_price: s.base_price != null ? Number(s.base_price) : undefined,
    hourly_rate: s.hourly_rate != null ? Number(s.hourly_rate) : undefined,
    consultation_fee: s.consultation_fee != null ? Number(s.consultation_fee) : undefined,
    category: (s.category as string) ?? undefined,
    image: (s.image as string) ?? undefined,
    total_bookings: s.total_bookings != null ? Number(s.total_bookings) : undefined,
  }
}

export function createCatalogService(api: ApiClient) {
  return {
    /**
     * Creates a platform service. Pass `draft` to save to `/platform-services/draft`
     * (only `name` required) instead of publishing.
     */
    async createPlatformService(
      payload: CreatePlatformServicePayload,
      options: { draft?: boolean } = {},
    ): Promise<CreatedCatalogService> {
      const body = compact({
        name: payload.name.trim(),
        display_name: payload.name.trim(),
        description: payload.description?.trim(),
        short_description: payload.short_description?.trim(),
        category: payload.category,
        subcategory: payload.subcategory,
        service_type: payload.service_type ?? 'fixed',
        base_price: payload.base_price,
        hourly_rate: payload.hourly_rate,
        consultation_fee: payload.consultation_fee,
        gst_percentage: payload.gst_percentage,
        duration: payload.duration,
        is_active: payload.is_active,
        is_featured: payload.is_featured,
        image: payload.image,
        tags: payload.tags?.length ? payload.tags : undefined,
        status: options.draft ? 'draft' : 'published',
      })
      const endpoint = options.draft ? '/platform-services/draft' : '/platform-services'
      const res = await api.post<unknown>(endpoint, body)
      const data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      const svc =
        data && typeof data === 'object' && 'service' in data
          ? (data.service as Record<string, unknown>)
          : data
      return {
        id: String(svc?.id ?? svc?._id ?? ''),
        name: String(svc?.name ?? payload.name),
      }
    },
    async getPublishedServices(limit = 50): Promise<CatalogService[]> {
      const res = await api.get<unknown>('/platform-services', {
        params: {
          page: 1,
          limit,
          status: 'published',
          is_active: true,
          sort_by: 'sort_order',
          sort_order: 'asc',
        },
      })
      const data = unwrapApiData<unknown>(res.data ?? res)
      const rows = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray((data as { services?: unknown[] }).services)
          ? (data as { services: Record<string, unknown>[] }).services
          : unwrapList<Record<string, unknown>>(data, 'services')
      return rows.map((s) => ({
        id: String(s.id ?? s._id ?? ''),
        name: String(s.name ?? 'Service'),
        short_description: s.short_description as string | undefined,
        base_price: s.base_price != null ? Number(s.base_price) : undefined,
        gst_percentage: s.gst_percentage != null ? Number(s.gst_percentage) : 18,
        service_type: s.service_type as CatalogService['service_type'],
      }))
    },

    /** Admin list with status/category/search filters + pagination. */
    async getServices(query: ServiceListQuery = {}): Promise<ServiceListResult> {
      const params: Record<string, unknown> = {
        page: query.page ?? 1,
        limit: query.limit ?? 30,
        sort_by: query.sort_by ?? 'created_at',
        sort_order: query.sort_order ?? 'desc',
      }
      if (query.search) params.search = query.search
      if (query.status) params.status = query.status
      if (query.is_active != null) params.is_active = query.is_active
      if (query.category) params.category = query.category
      if (query.service_type) params.service_type = query.service_type

      const res = await api.get<unknown>('/platform-services', { params })
      const data = unwrapApiData<unknown>(res.data ?? res)
      const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
      const rows = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray(obj.services)
          ? (obj.services as Record<string, unknown>[])
          : unwrapList<Record<string, unknown>>(data, 'services')
      const pag = (obj.pagination ?? {}) as Record<string, unknown>
      return {
        items: rows.map(mapServiceListItem).filter((s) => s.id),
        pagination: {
          page: Number(pag.page ?? query.page ?? 1),
          limit: Number(pag.limit ?? query.limit ?? rows.length),
          total: Number(pag.total ?? rows.length),
          totalPages: Number(pag.totalPages ?? 1),
        },
      }
    },

    async getServiceById(id: string): Promise<ServiceDetail> {
      const res = await api.get<unknown>(`/platform-services/${id}`)
      let data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      if (data && typeof data === 'object' && 'service' in data) {
        data = data.service as Record<string, unknown>
      }
      return {
        id: String(data.id ?? data._id ?? id),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        short_description: data.short_description as string | undefined,
        category: (data.category_id as string) ?? (data.category as string) ?? undefined,
        service_type: (data.service_type as ServiceType) ?? 'fixed',
        base_price: data.base_price != null ? Number(data.base_price) : undefined,
        hourly_rate: data.hourly_rate != null ? Number(data.hourly_rate) : undefined,
        consultation_fee: data.consultation_fee != null ? Number(data.consultation_fee) : undefined,
        gst_percentage: data.gst_percentage != null ? Number(data.gst_percentage) : undefined,
        duration: data.duration as string | undefined,
        image: data.image as string | undefined,
        is_active: Boolean(data.is_active),
        status: (data.status as ServiceStatus) ?? 'draft',
      }
    },

    async updatePlatformService(
      id: string,
      payload: UpdatePlatformServicePayload,
    ): Promise<CreatedCatalogService> {
      const body = compact({
        name: payload.name?.trim(),
        display_name: payload.name?.trim(),
        description: payload.description?.trim(),
        short_description: payload.short_description?.trim(),
        category: payload.category,
        service_type: payload.service_type,
        base_price: payload.base_price,
        hourly_rate: payload.hourly_rate,
        consultation_fee: payload.consultation_fee,
        gst_percentage: payload.gst_percentage,
        duration: payload.duration,
        is_active: payload.is_active,
        is_featured: payload.is_featured,
        image: payload.image,
        status: payload.status,
      })
      const res = await api.put<unknown>(`/platform-services/${id}`, body)
      const data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      const svc =
        data && typeof data === 'object' && 'service' in data
          ? (data.service as Record<string, unknown>)
          : data
      return {
        id: String(svc?.id ?? svc?._id ?? id),
        name: String(svc?.name ?? payload.name ?? ''),
      }
    },

    async deleteService(id: string): Promise<void> {
      await api.delete(`/platform-services/${id}`)
    },
  }
}

export type CatalogServiceApi = ReturnType<typeof createCatalogService>
