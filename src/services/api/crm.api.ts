/**
 * CRM REST client — fixer-backend `/api/crm/*`.
 * Used whenever CRM runs in API mode (production builds, or dev with REACT_APP_CRM_USE_API=true).
 * Requires Mongo + RBAC permissions view_crm / manage_crm.
 */
import { store } from '../../store'
import { apiClient } from '../apiClient'
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmMetrics,
} from '../../types/crm.types'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

type ApiEnvelope<T> = { success: boolean; data: T; message?: string }

function unwrap<T>(body: ApiEnvelope<T> | T): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const e = body as ApiEnvelope<T>
    if (e.success === false) {
      throw new Error(e.message || 'CRM request failed')
    }
    if ('data' in e && e.data !== undefined) {
      return e.data as T
    }
  }
  return body as T
}

async function getJson<T>(path: string): Promise<T> {
  const r = await apiClient.get<ApiEnvelope<T>>(path, {
    showSuccessToast: false,
    showErrorToast: true,
  })
  return unwrap(r as unknown as ApiEnvelope<T>)
}

async function sendJson<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const r =
    method === 'POST'
      ? await apiClient.post<ApiEnvelope<T>>(path, body, { showSuccessToast: false })
      : method === 'PUT'
        ? await apiClient.put<ApiEnvelope<T>>(path, body, { showSuccessToast: false })
        : await apiClient.delete<ApiEnvelope<T>>(path, { showSuccessToast: false })
  return unwrap(r as unknown as ApiEnvelope<T>)
}

export const crmApi = {
  async getFieldAccess(): Promise<{
    fields: Record<string, Record<string, { read: boolean; write: boolean }>>
  }> {
    return getJson<{
      fields: Record<string, Record<string, { read: boolean; write: boolean }>>
    }>('/crm/meta/field-access')
  },

  async getMetrics(): Promise<CrmMetrics> {
    return getJson<CrmMetrics>('/crm/metrics')
  },

  async listCompanies(): Promise<CrmCompany[]> {
    return getJson<CrmCompany[]>('/crm/companies')
  },
  async upsertCompany(row: Partial<CrmCompany> & { name: string }) {
    if (row.id) {
      return sendJson<CrmCompany>('PUT', `/crm/companies/${row.id}`, row)
    }
    return sendJson<CrmCompany>('POST', '/crm/companies', row)
  },
  async deleteCompany(id: string) {
    await sendJson<unknown>('DELETE', `/crm/companies/${id}`)
  },

  async listContacts(): Promise<CrmContact[]> {
    return getJson<CrmContact[]>('/crm/contacts')
  },
  /** Create requires firstName, lastName, email; updates may omit read-only identity fields per field policies. */
  async upsertContact(
    row:
      | (Partial<CrmContact> & { id: string })
      | (Partial<CrmContact> & { firstName: string; lastName: string; email: string }),
  ) {
    if (row.id) {
      return sendJson<CrmContact>('PUT', `/crm/contacts/${row.id}`, row)
    }
    return sendJson<CrmContact>('POST', '/crm/contacts', row)
  },
  async deleteContact(id: string) {
    await sendJson<unknown>('DELETE', `/crm/contacts/${id}`)
  },

  async listDeals(): Promise<CrmDeal[]> {
    return getJson<CrmDeal[]>('/crm/deals')
  },
  async upsertDeal(
    row: Partial<CrmDeal> & { name: string; amount: number; currency: string; stage: string }
  ) {
    if (row.id) {
      return sendJson<CrmDeal>('PUT', `/crm/deals/${row.id}`, row)
    }
    return sendJson<CrmDeal>('POST', '/crm/deals', row)
  },
  async deleteDeal(id: string) {
    await sendJson<unknown>('DELETE', `/crm/deals/${id}`)
  },

  async listActivities(): Promise<CrmActivity[]> {
    return getJson<CrmActivity[]>('/crm/activities')
  },
  async upsertActivity(
    row: Partial<CrmActivity> & { subject: string; type: CrmActivity['type']; status: CrmActivity['status'] }
  ) {
    if (row.id) {
      return sendJson<CrmActivity>('PUT', `/crm/activities/${row.id}`, row)
    }
    return sendJson<CrmActivity>('POST', '/crm/activities', row)
  },
  async deleteActivity(id: string) {
    await sendJson<unknown>('DELETE', `/crm/activities/${id}`)
  },

  async getGoogleAuthUrl(): Promise<string> {
    const d = await getJson<{ url: string }>('/crm/integrations/google/url')
    return d.url
  },

  async getIntegrationStatus() {
    return getJson<{
      googleConnected: boolean
      calendarSyncEnabled: boolean
      emailSyncEnabled: boolean
      lastCalendarSyncAt?: string
      lastEmailSyncAt?: string
    }>('/crm/integrations/status')
  },

  async syncCalendar() {
    return sendJson<{ imported: number }>('POST', '/crm/sync/calendar')
  },

  async syncEmail() {
    return sendJson<{ imported: number }>('POST', '/crm/sync/email')
  },

  async getFieldPolicies() {
    return getJson<{ rules: Array<{ roleKey: string; entity: string; field: string; read: boolean; write: boolean }> }>(
      '/crm/admin/field-policies'
    )
  },

  async saveFieldPolicies(
    rules: Array<{ roleKey: string; entity: string; field: string; read: boolean; write: boolean }>
  ) {
    return sendJson<{ rules: typeof rules }>('PUT', '/crm/admin/field-policies', { rules })
  },

  async downloadExport(entity: 'contacts' | 'companies' | 'deals' | 'activities') {
    const token = store.getState().auth?.token || null
    const res = await fetch(`${API_BASE}/crm/export/${entity}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { message?: string }).message || `Export failed (${res.status})`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}
