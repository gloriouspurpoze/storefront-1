/** Tracks SaaS go-live checklist completion per tenant (browser-local). Backend audit is still required for production. */

export type SaasPlatformChecklistId =
  | 'backend_tenant_isolation'
  | 'org_lifecycle'
  | 'billing_productized'
  | 'observability'
  | 'legal_dpa'
  | 'support_sla'

/** A single concrete action a super-admin takes to make progress on a checklist item. */
export type SaasChecklistStep = {
  text: string
  /** Internal admin route — rendered as a primary "Open" link button. */
  to?: string
  /** External URL (docs / dashboards / status pages) — opens in a new tab. */
  href?: string
  /**
   * Backend or frontend env var the operator needs to set.
   * Rendered as a copyable code chip so it's hard to typo.
   */
  env?: string
}

export type SaasChecklistItem = {
  id: SaasPlatformChecklistId
  title: string
  detail: string
  /** Short technical aside (one sentence). */
  tip?: string
  /** "How do I complete this as a super-admin?" — ordered, click-by-click. */
  steps?: SaasChecklistStep[]
}

/**
 * UI-facing checklist for "Is this organization ready to launch?".
 * Friendly titles + plain-English detail + numbered "how to do this" steps so a
 * super-admin can actually close each item without leaving the page.
 */
export const SAAS_PLATFORM_CHECKLIST_ITEMS: SaasChecklistItem[] = [
  {
    id: 'backend_tenant_isolation',
    title: 'Customer data stays separate',
    detail: 'Confirm every API and report only ever shows data for the active organization.',
    tip: 'Tech detail: server filters every query by tenant id; the X-Tenant-Id header alone is not trusted.',
    steps: [
      {
        text:
          'Open Organizations, pick the org, and click Manage to see its Isolation summary (users, domains, marketing, team work counts).',
        to: '/settings/tenants',
      },
      {
        text:
          'Repeat on a different org and confirm the numbers are different — that proves rows are filtered per tenant.',
        to: '/settings/tenants',
      },
      {
        text:
          "Sign in as a tenant admin (not super-admin) and walk through CRM, AMC, Team Work, Marketing. You should only see that one org's data.",
        to: '/login',
      },
    ],
  },
  {
    id: 'org_lifecycle',
    title: 'Sign-up, suspend & delete works end-to-end',
    detail:
      'You can add a new organization, invite an admin, suspend it, and delete it without leftover data.',
    tip:
      'Use Organizations → New tenant to test. Delete cascades CRM, AMC, marketing, team work, boards & domains.',
    steps: [
      {
        text:
          'Open Organizations and click New tenant. Pick a vertical, set a plan, and create a throwaway org for testing.',
        to: '/settings/tenants',
      },
      {
        text:
          'On the new row click Manage, then use Attach dashboard user by email to invite an admin. Ask them to sign in to confirm the invite works.',
        to: '/settings/tenants',
      },
      {
        text:
          'Click Suspend on that row and try signing in as the invited admin — they should be blocked. Click Unsuspend to restore access.',
        to: '/settings/tenants',
      },
      {
        text:
          'Open Manage → Danger zone → Delete tenant, type the slug to confirm, and verify the row disappears. All tenant-scoped data is cascade-removed.',
        to: '/settings/tenants',
      },
    ],
  },
  {
    id: 'billing_productized',
    title: 'Plans & billing are wired up',
    detail:
      'Pricing plans, trial period, and seat limits are set; payment failures pause the right things.',
    tip:
      'Stripe (or equivalent) webhooks update billingStatus on the tenant and gate premium modules.',
    steps: [
      {
        text: 'On the backend, set Stripe keys and the webhook signing secret in your environment.',
        env: 'STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET',
      },
      {
        text: 'On the frontend, set the customer billing portal URL so the Quick link button appears.',
        env: 'REACT_APP_BILLING_PORTAL_URL',
      },
      {
        text:
          'Open Organizations → Manage on a tenant. Pick a Plan, click Save plan, then Apply plan modules so the API entitlements match.',
        to: '/settings/tenants',
      },
      {
        text:
          'Send a test Stripe event to /api/webhooks/billing/stripe (stripe CLI: `stripe listen` → `stripe trigger customer.subscription.updated`) and confirm the tenant billingStatus flips.',
        href: 'https://stripe.com/docs/stripe-cli',
      },
    ],
  },
  {
    id: 'observability',
    title: 'You can see what each customer is doing',
    detail:
      'Errors and background jobs are tagged with the organization so you can investigate one customer at a time.',
    tip:
      'Sentry events carry tenant tag; job queues log tenantId; alerts fire on cross-tenant anomalies.',
    steps: [
      {
        text:
          'Set the Sentry DSN on the backend. app.ts already wires Sentry.setupExpressErrorHandler when this is present.',
        env: 'SENTRY_DSN',
      },
      {
        text: 'Optionally enable Sentry for the admin UI so frontend errors are captured too.',
        env: 'REACT_APP_SENTRY_DSN',
      },
      {
        text:
          'In Sentry, open Issues, filter by tag tenant_id and confirm at least one event carries it. (Send a test error from a tenant-scoped action if needed.)',
        href: 'https://sentry.io/issues/',
      },
      {
        text:
          'Tag your job queues (BullMQ / cron / scheduled handlers) with tenantId when emitting jobs so logs and retries can be filtered per customer.',
      },
    ],
  },
  {
    id: 'legal_dpa',
    title: 'Legal pages are published',
    detail:
      'Privacy policy, terms of service, and your data-processing agreement are live and linked from the app.',
    tip: 'Add the URLs as env vars and the Quick links section above lights up automatically.',
    steps: [
      {
        text: 'Publish Privacy and Terms pages on your marketing site (or wherever you host policies).',
      },
      {
        text: 'Add the public URLs as frontend env vars and rebuild/redeploy.',
        env: 'REACT_APP_LEGAL_PRIVACY_URL, REACT_APP_LEGAL_TERMS_URL',
      },
      {
        text:
          'For enterprise customers, host a DPA template and a subprocessors list. Add the URL so it shows up under Quick links.',
        env: 'REACT_APP_LEGAL_COMPLIANCE_DOCS_URL',
      },
      {
        text: 'Reload this page and confirm Privacy, Terms, and Compliance docs all appear under Quick links above.',
      },
    ],
  },
  {
    id: 'support_sla',
    title: 'Customers know how to reach you',
    detail:
      'Support channel, response-time promises, and incident updates are documented and discoverable.',
    tip: 'Link a status page, ticketing inbox, or in-app help. Keep severity tiers consistent.',
    steps: [
      {
        text:
          'Decide your support channel: in-app ticketing (already wired at /api/feedback-support/tickets), a shared inbox, or a chat tool.',
      },
      {
        text:
          'Document a severity matrix (P0–P3) with target response and resolution times. Put it in your DPA or customer onboarding doc.',
      },
      {
        text:
          'Spin up a status page (Statuspage, Better Stack, Instatus, …) and link it from your marketing site and from this app footer.',
        href: 'https://www.atlassian.com/software/statuspage',
      },
      {
        text:
          'Verify tenant admins know where to file tickets — walk a new org through it during onboarding.',
        to: '/support',
      },
    ],
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
