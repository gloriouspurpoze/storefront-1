import type { VerticalKey } from '../verticals'
import type { VerticalPlanDef } from './types'
import { homeServicesBillingPlans } from './home_services'
import { restaurantBillingPlans } from './restaurant'
import { salonBillingPlans } from './salon'
import { retailBillingPlans } from './retail'

export type { VerticalPlanDef, VerticalPlanLimits } from './types'
export { homeServicesBillingPlans, restaurantBillingPlans, salonBillingPlans, retailBillingPlans }

/**
 * Plans per vertical. Stub verticals reuse home-services pricing, except retail
 * which has its own e-commerce-first plans.
 */
const PLANS_BY_VERTICAL: Partial<Record<VerticalKey, VerticalPlanDef[]>> = {
  home_services: homeServicesBillingPlans,
  restaurant: restaurantBillingPlans,
  salon: salonBillingPlans,
  retail: retailBillingPlans,
  marketplace: retailBillingPlans,
}

export function marketingPlansForVertical(verticalKey: VerticalKey): VerticalPlanDef[] {
  return PLANS_BY_VERTICAL[verticalKey] ?? homeServicesBillingPlans
}

export function formatPlanPriceInr(plan: VerticalPlanDef): string | null {
  if (plan.priceMonthlyInr == null) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(plan.priceMonthlyInr)
}
