import type { ApiClient } from '../types'
import type { PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export interface ServiceRequestLocation {
  address: string
  city: string
  state: string
  zipCode: string
  coordinates?: { lat: number; lng: number }
}

export interface ServiceRequestRow {
  id: string
  title: string
  description: string
  serviceType: string
  status: 'open' | 'quoted' | 'booked' | 'in_progress' | 'completed' | 'cancelled'
  quotesCount?: number
  urgency: 'low' | 'medium' | 'high'
  budgetMin?: number
  budgetMax?: number
  preferredDate?: string
  location?: ServiceRequestLocation
  customerId: string
  providerId?: string
  createdAt: string
  updatedAt?: string
}

export interface ServiceRequestsListResponse {
  serviceRequests: ServiceRequestRow[]
  pagination: PaginationResponse
}

export interface ServiceRequestsQuery {
  page?: number
  limit?: number
  status?: string
  serviceType?: string
  urgency?: string
}

function mapRequest(raw: Record<string, unknown>): ServiceRequestRow {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? 'Request'),
    description: String(raw.description ?? ''),
    serviceType: String(raw.serviceType ?? raw.service_type ?? 'general'),
    status: (raw.status as ServiceRequestRow['status']) ?? 'open',
    quotesCount: raw.quotesCount != null ? Number(raw.quotesCount) : undefined,
    urgency: (raw.urgency as ServiceRequestRow['urgency']) ?? 'medium',
    budgetMin: raw.budgetMin != null ? Number(raw.budgetMin) : undefined,
    budgetMax: raw.budgetMax != null ? Number(raw.budgetMax) : undefined,
    preferredDate: raw.preferredDate as string | undefined,
    location: raw.location as ServiceRequestLocation | undefined,
    customerId: String(raw.customerId ?? raw.customer_id ?? ''),
    providerId: raw.providerId != null ? String(raw.providerId) : undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: raw.updatedAt as string | undefined,
  }
}

function normalizeList(raw: unknown): ServiceRequestsListResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    return {
      serviceRequests: data.map((r) => mapRequest(r as Record<string, unknown>)),
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const rows = Array.isArray(d.serviceRequests)
      ? d.serviceRequests
      : Array.isArray(d.data)
        ? d.data
        : []
    const pagination = (d.pagination ?? {
      page: 1,
      limit: rows.length,
      total: rows.length,
      totalPages: 1,
    }) as PaginationResponse
    return {
      serviceRequests: (rows as Record<string, unknown>[]).map(mapRequest),
      pagination,
    }
  }
  return { serviceRequests: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } }
}

export function createServiceRequestsService(api: ApiClient) {
  return {
    async getServiceRequests(query: ServiceRequestsQuery = {}): Promise<ServiceRequestsListResponse> {
      const res = await api.get<unknown>('/service-requests', {
        params: query as Record<string, unknown>,
      })
      return normalizeList(res.data ?? res)
    },
    async getServiceRequest(id: string): Promise<ServiceRequestRow> {
      const res = await api.get<unknown>(`/service-requests/${id}`)
      const data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      return mapRequest(data)
    },
    async updateServiceRequestStatus(id: string, status: string): Promise<ServiceRequestRow> {
      const res = await api.patch<unknown>(`/service-requests/${id}/status`, { status })
      const data = unwrapApiData<Record<string, unknown>>(res.data ?? res)
      return mapRequest(data)
    },
  }
}

export type ServiceRequestsService = ReturnType<typeof createServiceRequestsService>
