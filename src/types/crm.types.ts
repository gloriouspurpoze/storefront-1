/**
 * CRM domain for ProFixer.in admin: home services pipeline + optional B2B accounts + partner onboarding.
 *
 * Users / Bookings / Orders in fixer-backend are canonical; link CRM rows via platform* IDs when known.
 */

export type CrmDealStage =
  | 'inquiry'
  | 'quoted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'lost'

/** Homeowner job journey + repeat/churn + partner states */
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

export type CrmRecordType = 'customer' | 'partner' | 'b2b_account'

export type CrmActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'task'
  | 'note'
  | 'whatsapp'
  | 'sms'
  | 'site_visit'

export type CrmActivityStatus = 'open' | 'done' | 'cancelled'

export type CrmRelatedType = 'contact' | 'company' | 'deal'

export interface CrmCompany {
  id: string
  name: string
  industry?: string
  website?: string
  phone?: string
  city?: string
  country?: string
  employeeCount?: string
  annualRevenue?: string
  ownerId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CrmContact {
  id: string
  /** customer | partner | b2b_account — drives which lifecycle options are typical */
  recordType?: CrmRecordType
  firstName: string
  lastName: string
  email: string
  phone?: string
  /** Optional; often blank for B2C homeowners */
  jobTitle?: string
  companyId?: string
  lifecycle: CrmContactLifecycle
  leadSource?: string
  ownerId?: string
  tags?: string[]
  notes?: string
  /** Link to platform user when this CRM row mirrors a registered customer */
  platformUserId?: string
  /** Active or recent booking tied to this conversation */
  platformBookingId?: string
  /** Commerce order / job payment context */
  platformOrderId?: string
  locality?: string
  addressLine?: string
  serviceCategory?: string
  createdAt: string
  updatedAt: string
}

export interface CrmDeal {
  id: string
  name: string
  amount: number
  currency: string
  stage: CrmDealStage
  probability: number
  companyId?: string
  primaryContactId?: string
  ownerId?: string
  expectedCloseDate?: string
  notes?: string
  platformBookingId?: string
  platformOrderId?: string
  locality?: string
  serviceCategory?: string
  createdAt: string
  updatedAt: string
}

export interface CrmActivity {
  id: string
  subject: string
  type: CrmActivityType
  status: CrmActivityStatus
  priority: 'low' | 'normal' | 'high'
  dueAt?: string
  completedAt?: string
  relatedType?: CrmRelatedType
  relatedId?: string
  ownerId?: string
  body?: string
  createdAt: string
  updatedAt: string
}

export interface CrmMetrics {
  pipelineValue: number
  weightedPipeline: number
  openDeals: number
  /** Deals marked paid this calendar month */
  paidThisMonth: number
  activeLeads: number
  overdueTasks: number
  dealsByStage: Record<CrmDealStage, number>
}
