import type { ApiClient } from '../types'
import { unwrapApiData } from '../unwrap'

export type CrmContactLifecycle =
  | 'inquiry'
  | 'quoted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'repeat_customer'
  | 'churned'
  | 'partner_applied'
  | 'partner_verification'
  | 'partner_active'
  | 'partner_suspended'
  | 'partner_churned'

export interface CrmContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  lifecycle: CrmContactLifecycle
  locality?: string
  serviceCategory?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CrmMetrics {
  pipelineValue: number
  weightedPipeline: number
  openDeals: number
  paidThisMonth: number
  activeLeads: number
  overdueTasks: number
}

export type CreateCrmContactPayload = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  lifecycle?: CrmContactLifecycle
  locality?: string
  serviceCategory?: string
  notes?: string
}

export function createCrmService(api: ApiClient) {
  return {
    async getMetrics(): Promise<CrmMetrics> {
      const res = await api.get<unknown>('/crm/metrics')
      return unwrapApiData<CrmMetrics>(res.data ?? res)
    },
    async listContacts(): Promise<CrmContact[]> {
      const res = await api.get<unknown>('/crm/contacts')
      const data = unwrapApiData<unknown>(res.data ?? res)
      return Array.isArray(data) ? data : []
    },
    async createContact(payload: CreateCrmContactPayload): Promise<CrmContact> {
      const res = await api.post<unknown>('/crm/contacts', {
        ...payload,
        lifecycle: payload.lifecycle ?? 'inquiry',
      })
      return unwrapApiData<CrmContact>(res.data ?? res)
    },
  }
}

export type CrmService = ReturnType<typeof createCrmService>
