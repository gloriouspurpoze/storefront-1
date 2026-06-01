import type { VerticalPlanDef } from '../verticals/core/billingPlans'
import { homeServicesBillingPlans } from '../verticals/home_services/billingPlans'
import { restaurantBillingPlans } from '../verticals/restaurant/billingPlans'
import { salonBillingPlans } from '../verticals/salon/billingPlans'
import { retailBillingPlans } from '../verticals/retail/billingPlans'
import type { VerticalKey } from '../verticals/core/types'
import { getVerticalPack } from '../verticals/registry'

/**
 * Per-vertical billing plan fallback when a pack does not declare its own
 * `billingPlans`. Stub verticals reuse home-services pricing for now, except
 * retail which has its own e-commerce-first plans (cms + ecommerce baked in).
 */
const FALLBACK_PLANS: Partial<Record<VerticalKey, VerticalPlanDef[]>> = {
  home_services: homeServicesBillingPlans,
  restaurant: restaurantBillingPlans,
  salon: salonBillingPlans,
  retail: retailBillingPlans,
}

export function getBillingPlansForVertical(verticalKey: VerticalKey): VerticalPlanDef[] {
  const fromPack = getVerticalPack(verticalKey).billingPlans
  if (fromPack?.length) return fromPack
  return FALLBACK_PLANS[verticalKey] ?? homeServicesBillingPlans
}

export function getPlanForVertical(
  verticalKey: VerticalKey,
  planKey: string | null | undefined,
): VerticalPlanDef | null {
  if (!planKey?.trim()) return null
  const k = planKey.trim()
  return getBillingPlansForVertical(verticalKey).find((p) => p.key === k) ?? null
}

export function getRecommendedPlan(verticalKey: VerticalKey): VerticalPlanDef {
  const plans = getBillingPlansForVertical(verticalKey)
  return plans.find((p) => p.recommended) ?? plans[0]
}

export function getDefaultPlanKey(verticalKey: VerticalKey): string {
  return getRecommendedPlan(verticalKey).key
}

export function isKnownPlanForVertical(verticalKey: VerticalKey, planKey: string): boolean {
  return getBillingPlansForVertical(verticalKey).some((p) => p.key === planKey)
}

/** Resolve Stripe Price id from plan manifest + CRA env. */
export function resolveStripePriceId(plan: VerticalPlanDef): string | null {
  const envKey = plan.stripePriceIdEnv
  if (!envKey) return null
  const raw = (process.env as Record<string, string | undefined>)[envKey]
  return raw?.trim() || null
}

export function formatPlanPriceInr(plan: VerticalPlanDef): string | null {
  if (plan.priceMonthlyInr == null) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(plan.priceMonthlyInr)
}

/**
 * True when tenant has an explicit module allowlist that includes modules
 * outside the plan's included set (informational nudge only).
 */
export function tenantModulesExceedPlan(
  plan: VerticalPlanDef | null,
  featureModules: string[] | null,
): boolean {
  if (!plan || featureModules === null) return false
  const allowed = new Set(plan.includedModules)
  return featureModules.some((m) => !allowed.has(m))
}

export function planLabelFor(
  verticalKey: VerticalKey,
  planKey: string | null | undefined,
): string {
  if (!planKey) return 'No plan'
  const hit = getPlanForVertical(verticalKey, planKey)
  return hit?.label ?? planKey
}
