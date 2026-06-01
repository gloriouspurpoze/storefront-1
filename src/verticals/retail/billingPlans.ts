import type { VerticalPlanDef } from '../core/billingPlans'

/**
 * Retail / e-commerce SaaS plans.
 *
 * Designed for tenants whose primary surface is a storefront (D2C brand,
 * single-category boutique, perfume / cosmetics / apparel). Every tier ships
 * `ecommerce` + `cms` so the team gets products, orders, and a storefront-grade
 * marketing site out of the box; CRM and marketing campaigns unlock at Growth.
 */
export const retailBillingPlans: VerticalPlanDef[] = [
  {
    key: 'retail_starter',
    label: 'Starter',
    description: 'Single storefront: products, orders, and a marketing site.',
    priceMonthlyInr: 3999,
    includedModules: ['cms', 'ecommerce'],
    limits: { maxUsers: 5 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_RETAIL_STARTER',
    recommended: true,
  },
  {
    key: 'retail_growth',
    label: 'Growth',
    description: 'Adds CRM, email/SMS campaigns, and marketing workspace.',
    priceMonthlyInr: 8999,
    includedModules: ['cms', 'ecommerce', 'crm', 'marketing_workspace'],
    limits: { maxUsers: 20 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_RETAIL_GROWTH',
  },
  {
    key: 'retail_scale',
    label: 'Scale',
    description: 'Multi-brand operators with finance, team work, and bazaar.',
    priceMonthlyInr: 16999,
    includedModules: [
      'cms',
      'ecommerce',
      'crm',
      'marketing_workspace',
      'finance',
      'team_work',
      'bazaar',
    ],
    limits: { maxUsers: 80 },
    stripePriceIdEnv: 'REACT_APP_STRIPE_PRICE_RETAIL_SCALE',
  },
]
