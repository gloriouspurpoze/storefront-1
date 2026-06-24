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
  'App signup',
  'Google sign-in',
  'Website booking',
  'Mobile app booking',
  'Storefront',
  'Phone',
  'Website',
  'Google / local search',
  'Referral',
  'Partner application',
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

/** Post-conversion customers & active partners — shown on Contacts, not Leads. */
export function isContactLifecycle(lifecycle: CrmContactLifecycle): boolean {
  return !isLeadLifecycle(lifecycle)
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

/** Default win probability when stage changes (HubSpot-style pipeline hygiene). */
export const DEAL_STAGE_DEFAULT_PROBABILITY: Record<CrmDealStage, number> = {
  inquiry: 10,
  quoted: 30,
  scheduled: 50,
  in_progress: 70,
  completed: 90,
  paid: 100,
  lost: 0,
}

export const CRM_DEAL_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR'] as const

/** Pipeline column + card accent colors (Kanban). */
export const DEAL_STAGE_THEME: Record<
  CrmDealStage,
  {
    columnBg: string
    columnBorder: string
    headerBar: string
    headerDot: string
    headerText: string
    countBadge: string
    cardAccent: string
    cardRing: string
    funnelFill: string
  }
> = {
  inquiry: {
    columnBg: 'bg-slate-50/90 dark:bg-slate-950/40',
    columnBorder: 'border-slate-200/90 dark:border-slate-800',
    headerBar: 'bg-slate-500',
    headerDot: 'bg-slate-500',
    headerText: 'text-slate-800 dark:text-slate-100',
    countBadge: 'bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    cardAccent: 'border-l-slate-500',
    cardRing: 'ring-slate-200/80',
    funnelFill: 'bg-slate-500',
  },
  quoted: {
    columnBg: 'bg-amber-50/90 dark:bg-amber-950/20',
    columnBorder: 'border-amber-200/90 dark:border-amber-900/60',
    headerBar: 'bg-amber-500',
    headerDot: 'bg-amber-500',
    headerText: 'text-amber-950 dark:text-amber-100',
    countBadge: 'bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100',
    cardAccent: 'border-l-amber-500',
    cardRing: 'ring-amber-200/80',
    funnelFill: 'bg-amber-500',
  },
  scheduled: {
    columnBg: 'bg-sky-50/90 dark:bg-sky-950/20',
    columnBorder: 'border-sky-200/90 dark:border-sky-900/60',
    headerBar: 'bg-sky-500',
    headerDot: 'bg-sky-500',
    headerText: 'text-sky-950 dark:text-sky-100',
    countBadge: 'bg-sky-200/80 text-sky-950 dark:bg-sky-900/60 dark:text-sky-100',
    cardAccent: 'border-l-sky-500',
    cardRing: 'ring-sky-200/80',
    funnelFill: 'bg-sky-500',
  },
  in_progress: {
    columnBg: 'bg-violet-50/90 dark:bg-violet-950/20',
    columnBorder: 'border-violet-200/90 dark:border-violet-900/60',
    headerBar: 'bg-violet-500',
    headerDot: 'bg-violet-500',
    headerText: 'text-violet-950 dark:text-violet-100',
    countBadge: 'bg-violet-200/80 text-violet-950 dark:bg-violet-900/60 dark:text-violet-100',
    cardAccent: 'border-l-violet-500',
    cardRing: 'ring-violet-200/80',
    funnelFill: 'bg-violet-500',
  },
  completed: {
    columnBg: 'bg-emerald-50/90 dark:bg-emerald-950/20',
    columnBorder: 'border-emerald-200/90 dark:border-emerald-900/60',
    headerBar: 'bg-emerald-500',
    headerDot: 'bg-emerald-500',
    headerText: 'text-emerald-950 dark:text-emerald-100',
    countBadge: 'bg-emerald-200/80 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100',
    cardAccent: 'border-l-emerald-500',
    cardRing: 'ring-emerald-200/80',
    funnelFill: 'bg-emerald-500',
  },
  paid: {
    columnBg: 'bg-green-50/90 dark:bg-green-950/20',
    columnBorder: 'border-green-200/90 dark:border-green-900/60',
    headerBar: 'bg-green-600',
    headerDot: 'bg-green-600',
    headerText: 'text-green-950 dark:text-green-100',
    countBadge: 'bg-green-200/80 text-green-950 dark:bg-green-900/60 dark:text-green-100',
    cardAccent: 'border-l-green-600',
    cardRing: 'ring-green-200/80',
    funnelFill: 'bg-green-600',
  },
  lost: {
    columnBg: 'bg-rose-50/60 dark:bg-rose-950/15',
    columnBorder: 'border-rose-200/70 dark:border-rose-900/40',
    headerBar: 'bg-rose-400',
    headerDot: 'bg-rose-400',
    headerText: 'text-rose-900/80 dark:text-rose-200',
    countBadge: 'bg-rose-100/80 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    cardAccent: 'border-l-rose-400',
    cardRing: 'ring-rose-200/60',
    funnelFill: 'bg-rose-400',
  },
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

/** Lifecycles shown on Contacts (excludes pre-job funnel). */
export const POST_FUNNEL_LIFECYCLES: CrmContactLifecycle[] = ALL_CONTACT_LIFECYCLES.filter(
  (s) => !CUSTOMER_FUNNEL.includes(s) && !PARTNER_FUNNEL.includes(s),
)

export function normalizeRecordType(raw: string | undefined): CrmRecordType {
  if (raw === 'partner' || raw === 'b2b_account' || raw === 'customer') return raw
  return 'customer'
}
