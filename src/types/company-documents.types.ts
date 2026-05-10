/** Mirrors fixer-backend `CompanyDocumentTemplate` / `DocumentSignatureEnvelope`. */

export type CompanyDocAudience =
  | 'company_internal'
  | 'customer'
  | 'provider'
  | 'professional'
  | 'all_staff'

export type CompanyDocCategory =
  | 'policy'
  | 'onboarding'
  | 'hiring'
  | 'termination'
  | 'nda'
  | 'liability'
  | 'safety'
  | 'customer_terms'
  | 'contractor_agreement'
  | 'other'

export type CompanyDocContentFormat = 'html' | 'markdown' | 'pdf_only'

export interface CompanyDocumentTemplate {
  id: string
  title: string
  slug: string
  audience: CompanyDocAudience
  docCategory: CompanyDocCategory
  contentFormat: CompanyDocContentFormat
  body?: string
  pdfUrl?: string
  version: number
  isPublished: boolean
  isArchived: boolean
  tags: string[]
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

export type EnvelopeRecipientRole = 'customer' | 'provider' | 'professional' | 'internal'

export type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'declined' | 'cancelled'

export interface EnvelopeTemplateSummary {
  id: string
  title?: string
  slug?: string
  audience?: CompanyDocAudience
  docCategory?: CompanyDocCategory
  pdfUrl?: string
}

export interface DocumentSignatureEnvelope {
  id: string
  templateId: string | EnvelopeTemplateSummary
  recipientEmail: string
  recipientName?: string
  recipientRole: EnvelopeRecipientRole
  status: EnvelopeStatus
  signToken: string
  sentAt?: string
  viewedAt?: string
  signedAt?: string
  signedByIp?: string
  signedAcknowledgementText?: string
  adminNotes?: string
  emailLastSentAt?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CompanyDocumentsSummary {
  templatesActive: number
  envelopesOpen: number
  envelopesSigned: number
}

export interface CompanyDocsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TemplateListResponse {
  templates: CompanyDocumentTemplate[]
  pagination: CompanyDocsPagination
}

export interface EnvelopeListResponse {
  envelopes: DocumentSignatureEnvelope[]
  pagination: CompanyDocsPagination
}
