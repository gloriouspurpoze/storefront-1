/** CRM domain model — aligns with common B2B CRM objects (Salesforce/HubSpot-style). */

export type CrmDealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type CrmContactLifecycle =
  | 'subscriber'
  | 'lead'
  | 'mql'
  | 'sql'
  | 'opportunity'
  | 'customer'
  | 'churned'

export type CrmActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note'

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
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  companyId?: string
  lifecycle: CrmContactLifecycle
  leadSource?: string
  ownerId?: string
  tags?: string[]
  notes?: string
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
  wonThisMonth: number
  activeLeads: number
  overdueTasks: number
  dealsByStage: Record<CrmDealStage, number>
}
