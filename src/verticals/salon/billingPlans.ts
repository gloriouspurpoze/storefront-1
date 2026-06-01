import type { VerticalPlanDef } from '../core/billingPlans'

export const salonBillingPlans: VerticalPlanDef[] = [
  {
    key: 'salon_starter',
    label: 'Starter',
    description: 'Appointments, stylists, and client CRM.',
    priceMonthlyInr: 3499,
    includedModules: ['crm', 'cms'],
    limits: { maxUsers: 8, maxBookingsPerMonth: 1500 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_SALON_STARTER',
    recommended: true,
  },
  {
    key: 'salon_growth',
    label: 'Growth',
    description: 'Retail products, finance, and marketing campaigns.',
    priceMonthlyInr: 7499,
    includedModules: ['crm', 'cms', 'finance', 'marketing_workspace', 'ecommerce'],
    limits: { maxUsers: 30, maxBookingsPerMonth: 8000 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_SALON_GROWTH',
  },
  {
    key: 'salon_scale',
    label: 'Scale',
    description: 'Multi-branch salons with team work and full entitlements.',
    priceMonthlyInr: 12999,
    includedModules: [
      'crm',
      'cms',
      'finance',
      'marketing_workspace',
      'team_work',
      'ecommerce',
    ],
    limits: { maxUsers: 80 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_SALON_SCALE',
  },
]
