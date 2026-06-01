/**
 * SaaS plan definitions per vertical pack.
 *
 * `planKey` is stored on `Tenant.planKey` in fixer-backend. Stripe Price IDs are
 * referenced by env var names until checkout is wired end-to-end.
 */

export interface VerticalPlanLimits {
  maxUsers?: number
  maxBookingsPerMonth?: number
}

export interface VerticalPlanDef {
  key: string
  label: string
  description: string
  /** Display price in INR (informational in admin UI). */
  priceMonthlyInr?: number
  /** Seeds / suggests `Tenant.featureModules` when applying a plan. */
  includedModules: string[]
  limits?: VerticalPlanLimits
  /** CRA env var holding Stripe Price id (e.g. REACT_APP_STRIPE_PRICE_HS_GROWTH). */
  stripePriceIdEnv?: string
  recommended?: boolean
}
