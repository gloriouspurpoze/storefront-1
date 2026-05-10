import { api } from './base'
import type {
  CompanyDocumentsSummary,
  CompanyDocumentTemplate,
  DocumentSignatureEnvelope,
  EnvelopeListResponse,
  TemplateListResponse,
} from '../../types/company-documents.types'

const silent = { showSuccessToast: false, showLoading: false } as const

/** Public signing page lives on the API host (no admin JWT). */
export function publicDocumentSignUrl(signToken: string): string {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
  const origin = raw.endsWith('/api') ? raw.slice(0, -4) : raw
  return `${origin}/api/company-documents/public/sign/${encodeURIComponent(signToken)}`
}

export class CompanyDocumentsService {
  static getSummary() {
    return api.get<CompanyDocumentsSummary>('/company-documents/summary', silent)
  }

  static listTemplates(params?: {
    page?: number
    limit?: number
    audience?: string
    docCategory?: string
    search?: string
    includeArchived?: boolean
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.audience) q.set('audience', params.audience)
    if (params?.docCategory) q.set('docCategory', params.docCategory)
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.includeArchived) q.set('includeArchived', 'true')
    const qs = q.toString()
    return api.get<TemplateListResponse>(`/company-documents/templates${qs ? `?${qs}` : ''}`, silent)
  }

  static getTemplate(id: string) {
    return api.get<CompanyDocumentTemplate>(`/company-documents/templates/${id}`, silent)
  }

  static createTemplate(body: Record<string, unknown>) {
    return api.post<CompanyDocumentTemplate>('/company-documents/templates', body, {
      successMessage: 'Template created.',
      loadingMessage: 'Saving…',
    })
  }

  static patchTemplate(id: string, body: Record<string, unknown>) {
    return api.patch<CompanyDocumentTemplate>(`/company-documents/templates/${id}`, body, {
      successMessage: 'Template updated.',
    })
  }

  static archiveTemplate(id: string) {
    return api.post<CompanyDocumentTemplate>(`/company-documents/templates/${id}/archive`, {}, {
      successMessage: 'Template archived.',
    })
  }

  static listEnvelopes(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    if (params?.search?.trim()) q.set('search', params.search.trim())
    const qs = q.toString()
    return api.get<EnvelopeListResponse>(`/company-documents/envelopes${qs ? `?${qs}` : ''}`, silent)
  }

  static createEnvelope(body: Record<string, unknown>) {
    return api.post<DocumentSignatureEnvelope>('/company-documents/envelopes', body, {
      successMessage: 'Envelope created.',
      loadingMessage: 'Creating…',
    })
  }

  static patchEnvelope(id: string, body: Record<string, unknown>, opts?: { successMessage?: string }) {
    return api.patch<DocumentSignatureEnvelope>(`/company-documents/envelopes/${id}`, body, {
      successMessage: opts?.successMessage ?? 'Envelope updated.',
    })
  }

  static sendEnvelopeEmail(id: string, body?: { message?: string }) {
    return api.post<{ signUrl: string }>(`/company-documents/envelopes/${id}/send-email`, body ?? {}, {
      successMessage: 'Signing email sent.',
      loadingMessage: 'Sending…',
    })
  }

  static markEnvelopeSigned(id: string, body?: { acknowledgement?: string }) {
    return api.post<DocumentSignatureEnvelope>(`/company-documents/envelopes/${id}/mark-signed`, body ?? {}, {
      successMessage: 'Recorded as signed.',
    })
  }
}
