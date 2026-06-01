import type { VerticalKey, VerticalPackDefinition } from './core/types'
import { DEFAULT_VERTICAL_KEY } from './core/types'
import { homeServicesPack } from './home_services/sidebarManifest'
import { restaurantPack } from './restaurant/sidebarManifest'
import { salonPack } from './salon/sidebarManifest'
import { retailBillingPlans } from './retail/billingPlans'
import { buildGenericVerticalPack } from './stubs/genericVerticalPack'
import { validateVerticalPack } from './validatePack'

/**
 * Pack registry — must list **every** key in `VerticalKey`.
 *
 * Three packs are fully productized (home_services, restaurant, salon) with
 * dedicated sidebars and dashboards. The other six (fitness, real_estate,
 * b2b_services, retail, healthcare, education) ship as **stub packs**: they
 * reuse the home-services sidebar but the backend already accepts them, so
 * super-admins can provision tenants for these industries today.
 *
 * The `retail` stub gets its own e-commerce-first billing plans because that's
 * what differentiates retail tenants in the wild (storefront over services).
 */
const PACKS: Record<VerticalKey, VerticalPackDefinition> = {
  home_services: homeServicesPack,
  restaurant: restaurantPack,
  salon: salonPack,
  fitness: buildGenericVerticalPack(
    'fitness',
    'Fitness & gyms',
    'Studios, gyms, and classes — member bookings and passes.',
    'for-fitness',
  ),
  real_estate: buildGenericVerticalPack(
    'real_estate',
    'Real estate',
    'Property listings, viewings, and broker workflows.',
    'for-real-estate',
  ),
  b2b_services: buildGenericVerticalPack(
    'b2b_services',
    'B2B services',
    'Agencies and professional services with deal-led pipelines.',
    'for-b2b-services',
  ),
  retail: {
    ...buildGenericVerticalPack(
      'retail',
      'Retail / e-commerce',
      'D2C brands and online stores — products, orders, storefront.',
      'for-retail',
    ),
    billingPlans: retailBillingPlans,
    defaultModules: ['cms', 'ecommerce'],
  },
  healthcare: buildGenericVerticalPack(
    'healthcare',
    'Healthcare',
    'Clinics and practitioners — appointments and patient records.',
    'for-healthcare',
  ),
  education: buildGenericVerticalPack(
    'education',
    'Education & tutoring',
    'Schools, coaches, and enrollment-led businesses.',
    'for-education',
  ),
}

const validated = new Set<VerticalKey>()

function assertPackValid(pack: VerticalPackDefinition) {
  if (process.env.NODE_ENV === 'production') return
  if (validated.has(pack.key)) return
  validateVerticalPack(pack)
  validated.add(pack.key)
}

export function getVerticalPack(key: VerticalKey | null | undefined): VerticalPackDefinition {
  const pack = !key ? PACKS[DEFAULT_VERTICAL_KEY] : PACKS[key] ?? PACKS[DEFAULT_VERTICAL_KEY]
  assertPackValid(pack)
  return pack
}

/**
 * Industry options surfaced in pickers (Organizations → New tenant, signup).
 * Order is deliberate: fully-featured packs first, stub packs last (still
 * usable — backend accepts them — but operators see they're "early access").
 */
export const VERTICAL_PACK_OPTIONS: Array<
  Pick<VerticalPackDefinition, 'key' | 'label' | 'description' | 'marketingSlug'>
> = (
  [
    homeServicesPack.key,
    restaurantPack.key,
    salonPack.key,
    'retail',
    'fitness',
    'healthcare',
    'education',
    'real_estate',
    'b2b_services',
  ] satisfies VerticalKey[]
).map((key) => {
  const pack = PACKS[key]
  return {
    key: pack.key,
    label: pack.label,
    description: pack.description,
    marketingSlug: pack.marketingSlug,
  }
})

export function verticalKeyFromMarketingSlug(slug: string): VerticalKey | null {
  const hit = Object.values(PACKS).find((p) => p.marketingSlug === slug)
  return hit?.key ?? null
}

/** Public marketing paths (`/for-restaurants` → `/landing/for-restaurants`). */
export const MARKETING_LANDING_SLUGS: string[] = Object.values(PACKS)
  .map((p) => p.marketingSlug)
  .filter((s): s is string => Boolean(s))
