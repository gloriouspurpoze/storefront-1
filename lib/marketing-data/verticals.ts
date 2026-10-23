/**
 * Industry packs as the marketing site and signup see them. The admin's full
 * pack definitions (sidebars, dashboards) live in `src/verticals`; keep keys,
 * labels and slugs here in sync with those — `verticalPacks.test.ts` asserts it.
 */
export type VerticalKey =
  | 'home_services'
  | 'restaurant'
  | 'salon'
  | 'fitness'
  | 'real_estate'
  | 'b2b_services'
  | 'retail'
  | 'marketplace'
  | 'healthcare'
  | 'education'

export interface MarketingVertical {
  key: VerticalKey
  label: string
  description: string
  /** Public URL slug, e.g. `for-restaurants` → `torqstudio.com/for-restaurants`. */
  marketingSlug: string
}

export const MARKETING_VERTICALS: readonly MarketingVertical[] = [
  {
    key: 'home_services',
    label: 'Home Services',
    description:
      'On-site services dispatched to a customer address: plumbing, electrical, cleaning, appliance repair, and related trades.',
    marketingSlug: 'for-home-services',
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    description: 'Table service, menu, reservations, and order operations.',
    marketingSlug: 'for-restaurants',
  },
  {
    key: 'salon',
    label: 'Salon & spa',
    description: 'Appointments, stylists, treatments, and light retail for salon and spa businesses.',
    marketingSlug: 'for-salons',
  },
  {
    key: 'fitness',
    label: 'Fitness & gyms',
    description: 'Studios, gyms, and classes — member bookings and passes.',
    marketingSlug: 'for-fitness',
  },
  {
    key: 'real_estate',
    label: 'Real estate',
    description: 'Property listings, viewings, and broker workflows.',
    marketingSlug: 'for-real-estate',
  },
  {
    key: 'b2b_services',
    label: 'B2B services',
    description: 'Agencies and professional services with deal-led pipelines.',
    marketingSlug: 'for-b2b-services',
  },
  {
    key: 'retail',
    label: 'Retail / e-commerce',
    description: 'D2C brands and online stores — products, orders, storefront.',
    marketingSlug: 'for-retail',
  },
  {
    key: 'marketplace',
    label: 'Marketplace (multi-vendor)',
    description: 'Many sellers, one storefront — seller onboarding, split checkout, and payouts.',
    marketingSlug: 'for-marketplaces',
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    description: 'Clinics and practitioners — appointments and patient records.',
    marketingSlug: 'for-healthcare',
  },
  {
    key: 'education',
    label: 'Education & tutoring',
    description: 'Schools, coaches, and enrollment-led businesses.',
    marketingSlug: 'for-education',
  },
]

export function marketingVerticalBySlug(slug: string): MarketingVertical | null {
  return MARKETING_VERTICALS.find((v) => v.marketingSlug === slug) ?? null
}

export function marketingVerticalByKey(key: VerticalKey): MarketingVertical {
  return MARKETING_VERTICALS.find((v) => v.key === key) ?? MARKETING_VERTICALS[0]
}
