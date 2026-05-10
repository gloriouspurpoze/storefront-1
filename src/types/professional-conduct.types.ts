export type ProfessionalConductActionType = 'penalty' | 'warning' | 'fine' | 'reward'

export type ProfessionalConductCategory =
  | 'attendance'
  | 'quality'
  | 'safety'
  | 'customer_complaint'
  | 'policy_breach'
  | 'incentive'
  | 'performance_bonus'
  | 'referral'
  | 'other'

export type ProfessionalConductSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ProfessionalConductStatus = 'active' | 'appealed' | 'revoked' | 'closed'

export interface ProfessionalConductRecordDto {
  id: string
  tenantId: string | null
  professionalId: string
  professionalName?: string | null
  professionalEmail?: string | null
  actionType: ProfessionalConductActionType
  category: ProfessionalConductCategory
  severity?: ProfessionalConductSeverity | null
  title: string
  description?: string | null
  amountInr?: number | null
  effectiveDate?: string
  relatedBookingId?: string | null
  internalReference?: string | null
  status: ProfessionalConductStatus
  recordedBy?: string | null
  appealNotes?: string | null
  appealedAt?: string | null
  revokeReason?: string | null
  revokedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ProfessionalConductListResponse {
  records: ProfessionalConductRecordDto[]
  total: number
  page: number
  limit: number
}
