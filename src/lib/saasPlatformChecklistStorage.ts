/** Tracks SaaS go-live checklist completion per tenant (browser-local). Backend audit is still required for production. */

export type SaasPlatformChecklistId =
  | 'backend_tenant_isolation'
  | 'org_lifecycle'
  | 'billing_productized'
  | 'observability'
  | 'legal_dpa'
  | 'support_sla'

export const SAAS_PLATFORM_CHECKLIST_ITEMS: {
  id: SaasPlatformChecklistId
  title: string
  detail: string
}[] = [
  {
    id: 'backend_tenant_isolation',
    title: 'Server-side tenant isolation',
    detail:
      'Every query scoped by tenant/org id; never trust headers alone. Same DB with row-level tenancy or separate schemas.',
  },
  {
    id: 'org_lifecycle',
    title: 'Organization lifecycle',
    detail: 'Self-serve or admin signup, invites, suspension, export/delete aligned with privacy policy.',
  },
  {
    id: 'billing_productized',
    title: 'Billing & entitlements',
    detail: 'Stripe Billing / Paddle (or equivalent): plans, trials, seat limits, webhook-driven feature gates.',
  },
  {
    id: 'observability',
    title: 'Per-tenant observability',
    detail: 'Error reporting and job queues tagged by tenant; alert on cross-tenant anomalies.',
  },
  {
    id: 'legal_dpa',
    title: 'Legal & subprocessors',
    detail: 'DPA template, privacy/terms URLs, subprocessors list, data residency stance documented.',
  },
  {
    id: 'support_sla',
    title: 'Support & incidents',
    detail: 'Ticketing channel, severity matrix, status page or comms path for downtime.',
  },
]

const STORAGE_PREFIX = 'fixer.saasPlatformChecklist.v1'

function key(tenantKey: string): string {
  return `${STORAGE_PREFIX}.${tenantKey || 'global'}`
}

export function loadSaasChecklistDone(tenantId: string | null): Record<SaasPlatformChecklistId, boolean> {
  const empty = (): Record<SaasPlatformChecklistId, boolean> => ({
    backend_tenant_isolation: false,
    org_lifecycle: false,
    billing_productized: false,
    observability: false,
    legal_dpa: false,
    support_sla: false,
  })
  try {
    const raw = window.localStorage.getItem(key(tenantId || 'global'))
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<Record<SaasPlatformChecklistId, boolean>>
    const base = empty()
    for (const id of Object.keys(base) as SaasPlatformChecklistId[]) {
      if (parsed[id] === true) base[id] = true
    }
    return base
  } catch {
    return empty()
  }
}

export function saveSaasChecklistDone(
  tenantId: string | null,
  done: Record<SaasPlatformChecklistId, boolean>,
): void {
  try {
    window.localStorage.setItem(key(tenantId || 'global'), JSON.stringify(done))
  } catch {
    /* quota / private mode */
  }
}
