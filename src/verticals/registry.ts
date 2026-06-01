import type { VerticalKey, VerticalPackDefinition } from './core/types'
import { DEFAULT_VERTICAL_KEY } from './core/types'
import { homeServicesPack } from './home_services/sidebarManifest'
import { restaurantPack } from './restaurant/sidebarManifest'
import { salonPack } from './salon/sidebarManifest'
import { buildGenericVerticalPack } from './stubs/genericVerticalPack'
import { validateVerticalPack } from './validatePack'

const PACKS: Record<VerticalKey, VerticalPackDefinition> = {
  home_services: homeServicesPack,
  restaurant: restaurantPack,
  salon: salonPack,
  clinic: buildGenericVerticalPack('clinic', 'Clinic', 'Healthcare appointments and patient operations.', 'for-clinics'),
  fitness: buildGenericVerticalPack('fitness', 'Fitness', 'Gyms, classes, and member bookings.', 'for-fitness'),
  auto_repair: buildGenericVerticalPack('auto_repair', 'Auto repair', 'Garage work orders and parts.', 'for-auto-repair'),
  tutoring: buildGenericVerticalPack('tutoring', 'Tutoring', 'Classes, coaches, and enrollments.', 'for-tutoring'),
  custom: buildGenericVerticalPack('custom', 'Custom', 'Configurable pack for bespoke deployments.', 'for-custom'),
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

export const VERTICAL_PACK_OPTIONS: Array<
  Pick<VerticalPackDefinition, 'key' | 'label' | 'description' | 'marketingSlug'>
> = [
  {
    key: homeServicesPack.key,
    label: homeServicesPack.label,
    description: homeServicesPack.description,
    marketingSlug: homeServicesPack.marketingSlug,
  },
  {
    key: restaurantPack.key,
    label: restaurantPack.label,
    description: restaurantPack.description,
    marketingSlug: restaurantPack.marketingSlug,
  },
  {
    key: salonPack.key,
    label: salonPack.label,
    description: salonPack.description,
    marketingSlug: salonPack.marketingSlug,
  },
]

export function verticalKeyFromMarketingSlug(slug: string): VerticalKey | null {
  const hit = Object.values(PACKS).find((p) => p.marketingSlug === slug)
  return hit?.key ?? null
}

/** Public marketing paths (`/for-restaurants` → `/landing/for-restaurants`). */
export const MARKETING_LANDING_SLUGS: string[] = Object.values(PACKS)
  .map((p) => p.marketingSlug)
  .filter((s): s is string => Boolean(s))
