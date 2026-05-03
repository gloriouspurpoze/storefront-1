/**
 * ProFixer.in (home services) CRM conventions.
 *
 * Canonical data: platform Users, Bookings, and Orders own identity and job state.
 * CRM contacts/deals are an admin overlay: use platformUserId / platformBookingId / platformOrderId
 * to deep-link; denormalized locality/serviceCategory support ops without opening multiple tabs.
 */
import type {
  CrmActivityType,
  CrmContactLifecycle,
  CrmDealStage,
  CrmMetrics,
  CrmRecordType,
} from '../types/crm.types'

/** Canonical value for WhatsApp-originated leads (use in forms and filters). */
export const CRM_WHATSAPP_LEAD_SOURCE = 'WhatsApp' as const

export const CRM_LEAD_SOURCE_PRESETS = [
  CRM_WHATSAPP_LEAD_SOURCE,
  'Phone',
  'Website',
  'Google / local search',
  'Referral',
  'Partner',
  'Walk-in',
  'Other',
] as const

/** Pre-job customer funnel (shown on Leads) */
export const CUSTOMER_FUNNEL: CrmContactLifecycle[] = [
  'inquiry',
  'quoted',
  'scheduled',
  'in_progress',
]

/** Partner onboarding funnel */
export const PARTNER_FUNNEL: CrmContactLifecycle[] = ['partner_applied', 'partner_verification']

export function isLeadLifecycle(lifecycle: CrmContactLifecycle): boolean {
  return CUSTOMER_FUNNEL.includes(lifecycle) || PARTNER_FUNNEL.includes(lifecycle)
}

export const DEAL_PIPELINE_STAGES: CrmDealStage[] = [
  'inquiry',
  'quoted',
  'scheduled',
  'in_progress',
  'completed',
  'paid',
  'lost',
]

export const CONTACT_LIFECYCLE_LABELS: Record<CrmContactLifecycle, string> = {
  inquiry: 'Inquiry',
  quoted: 'Quoted',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  paid: 'Paid',
  repeat_customer: 'Repeat customer',
  churned: 'Churned',
  partner_applied: 'Partner — applied',
  partner_verification: 'Partner — verification',
  partner_active: 'Partner — active',
  partner_suspended: 'Partner — suspended',
  partner_churned: 'Partner — churned',
}

export const DEAL_STAGE_LABELS: Record<CrmDealStage, string> = {
  inquiry: 'Inquiry',
  quoted: 'Quoted',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  paid: 'Paid',
  lost: 'Lost',
}

/** Activity type dropdown order (filters + forms). */
export const ACTIVITY_TYPES_ORDERED: CrmActivityType[] = [
  'call',
  'whatsapp',
  'sms',
  'email',
  'site_visit',
  'meeting',
  'task',
  'note',
]

export const ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  task: 'Task',
  note: 'Note',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  site_visit: 'Site visit',
}

export const RECORD_TYPE_LABELS: Record<CrmRecordType, string> = {
  customer: 'Homeowner / customer',
  partner: 'Service partner',
  b2b_account: 'B2B account contact',
}

export function adminPathToUser(id: string) {
  return `/users?highlight=${encodeURIComponent(id)}`
}

export function adminPathToBooking(id: string) {
  return `/bookings/${encodeURIComponent(id)}`
}

export function adminPathToOrder(id: string) {
  return `/orders?highlight=${encodeURIComponent(id)}`
}

const LEGACY_LIFECYCLE_MAP: Record<string, CrmContactLifecycle> = {
  subscriber: 'inquiry',
  lead: 'inquiry',
  mql: 'quoted',
  sql: 'scheduled',
  opportunity: 'in_progress',
  customer: 'repeat_customer',
}

const LEGACY_DEAL_STAGE_MAP: Record<string, CrmDealStage> = {
  lead: 'inquiry',
  qualified: 'inquiry',
  proposal: 'quoted',
  negotiation: 'in_progress',
  won: 'paid',
}

/** Map persisted rows from older CRM schema to current niche model */
export function migrateContactLifecycle(raw: string | undefined): CrmContactLifecycle {
  if (!raw) return 'inquiry'
  if (raw in CONTACT_LIFECYCLE_LABELS) return raw as CrmContactLifecycle
  return LEGACY_LIFECYCLE_MAP[raw] ?? 'inquiry'
}

export function migrateDealStage(raw: string | undefined): CrmDealStage {
  if (!raw) return 'inquiry'
  if (raw in DEAL_STAGE_LABELS) return raw as CrmDealStage
  return LEGACY_DEAL_STAGE_MAP[raw] ?? 'inquiry'
}

const ACTIVITY_TYPES_KNOWN = new Set<string>([
  'call',
  'email',
  'meeting',
  'task',
  'note',
  'whatsapp',
  'sms',
  'site_visit',
])

export function migrateActivityType(raw: string | undefined): CrmActivityType {
  if (raw && ACTIVITY_TYPES_KNOWN.has(raw)) return raw as CrmActivityType
  return 'note'
}

/** Merge legacy stage keys into the current pipeline shape (for API or old local data). */
export function normalizeDealsByStage(
  input: Partial<Record<string, number>> | undefined
): Record<CrmDealStage, number> {
  const acc = {} as Record<CrmDealStage, number>
  for (const s of DEAL_PIPELINE_STAGES) acc[s] = 0
  if (!input) return acc
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== 'number' || v <= 0) continue
    const nk = migrateDealStage(k)
    acc[nk] += v
  }
  return acc
}

export type CrmMetricsApiShape = Partial<CrmMetrics> & { wonThisMonth?: number }

export function coerceCrmMetrics(raw: CrmMetricsApiShape): CrmMetrics {
  return {
    pipelineValue: raw.pipelineValue ?? 0,
    weightedPipeline: raw.weightedPipeline ?? 0,
    openDeals: raw.openDeals ?? 0,
    paidThisMonth: raw.paidThisMonth ?? raw.wonThisMonth ?? 0,
    activeLeads: raw.activeLeads ?? 0,
    overdueTasks: raw.overdueTasks ?? 0,
    dealsByStage: normalizeDealsByStage(raw.dealsByStage as Record<string, number> | undefined),
  }
}

export const ALL_CONTACT_LIFECYCLES: CrmContactLifecycle[] = [
  'inquiry',
  'quoted',
  'scheduled',
  'in_progress',
  'completed',
  'paid',
  'repeat_customer',
  'churned',
  'partner_applied',
  'partner_verification',
  'partner_active',
  'partner_suspended',
  'partner_churned',
]

export function normalizeRecordType(raw: string | undefined): CrmRecordType {
  if (raw === 'partner' || raw === 'b2b_account' || raw === 'customer') return raw
  return 'customer'
}
