import type { VerticalPlanDef } from '../core/billingPlans'

export const restaurantBillingPlans: VerticalPlanDef[] = [
  {
    key: 'rest_starter',
    label: 'Starter',
    description: 'Reservations, menu, and basic CRM for a single location.',
    priceMonthlyInr: 4999,
    includedModules: ['crm', 'cms', 'ecommerce'],
    limits: { maxUsers: 10, maxBookingsPerMonth: 2000 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_REST_STARTER',
    recommended: true,
  },
  {
    key: 'rest_pro',
    label: 'Pro',
    description: 'Multi-station ops with finance and marketing workspace.',
    priceMonthlyInr: 9999,
    includedModules: ['crm', 'cms', 'finance', 'ecommerce', 'marketing_workspace'],
    limits: { maxUsers: 40, maxBookingsPerMonth: 10000 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_REST_PRO',
  },
  {
    key: 'rest_enterprise',
    label: 'Enterprise',
    description: 'Full module set for groups and franchise operators.',
    priceMonthlyInr: 19999,
    includedModules: [
      'crm',
      'cms',
      'finance',
      'marketing_workspace',
      'team_work',
      'ecommerce',
    ],
    limits: { maxUsers: 200 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_REST_ENTERPRISE',
  },
]
