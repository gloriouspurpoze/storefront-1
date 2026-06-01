import type { VerticalPlanDef } from '../core/billingPlans'

export const homeServicesBillingPlans: VerticalPlanDef[] = [
  {
    key: 'hs_starter',
    label: 'Starter',
    description: 'Dispatch, bookings, and CRM for a small crew.',
    priceMonthlyInr: 2999,
    includedModules: ['crm', 'cms'],
    limits: { maxUsers: 5, maxBookingsPerMonth: 500 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_HS_STARTER',
    recommended: true,
  },
  {
    key: 'hs_growth',
    label: 'Growth',
    description: 'Adds finance, marketing workspace, and team collaboration.',
    priceMonthlyInr: 7999,
    includedModules: ['crm', 'cms', 'finance', 'marketing_workspace', 'team_work'],
    limits: { maxUsers: 25, maxBookingsPerMonth: 5000 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_HS_GROWTH',
  },
  {
    key: 'hs_scale',
    label: 'Scale',
    description: 'Full platform including bazaar and e-commerce modules.',
    priceMonthlyInr: 14999,
    includedModules: [
      'crm',
      'cms',
      'finance',
      'marketing_workspace',
      'team_work',
      'bazaar',
      'ecommerce',
    ],
    limits: { maxUsers: 100, maxBookingsPerMonth: 25000 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_HS_SCALE',
  },
]
