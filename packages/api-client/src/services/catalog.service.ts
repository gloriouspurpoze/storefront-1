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

export function createCatalogService(api: ApiClient) {
  return {
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
  }
}

export type CatalogServiceApi = ReturnType<typeof createCatalogService>
