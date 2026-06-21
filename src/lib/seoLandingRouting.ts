import { buildNearMeCategoryPublicPath, buildNearMeLocalityPublicPath } from './nearMeSeo'
import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import {
  buildEmergencyLocalityPublicPath,
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
  isPrimaryEmergencyCategory,
} from './serviceCatalogUrlSlugs'

export type SeoLandingFunnelUrls = {
  serviceSlug: string
  locationSlug: string
  preferredCategory: string
  booking: string
  nearMe: string
  emergency: string
  emergencyIsPrimaryCategory: boolean
}

/** Resolve category + area slugs from CMS draft (all known field aliases). */
export function resolveSeoLandingRoutingSlugs(
  draft: Record<string, unknown>,
  opts?: { kind?: SeoLandingEntityKind; pageSlug?: string },
): {
  serviceSlug: string
  locationSlug: string
} {
  const serviceSlug = String(
    draft.serviceSlug ?? draft.service ?? (Array.isArray(draft.servicesOffered) ? draft.servicesOffered[0] : '') ?? '',
  )
    .trim()
    .toLowerCase()

  const pageSlug = String(opts?.pageSlug ?? draft.slug ?? '').trim().toLowerCase()

  const locationSlug = String(
    draft.locationSlug ??
      draft.localitySlug ??
      draft.location ??
      (Array.isArray(draft.areasServed) ? draft.areasServed[0] : '') ??
      (opts?.kind === 'locations' ? pageSlug : '') ??
      '',
  )
    .trim()
    .toLowerCase()

  return { serviceSlug, locationSlug }
}

/** Booking, near-me, and emergency funnel paths for Setup + publish panels. */
export function resolveSeoLandingFunnelUrls(
  draft: Record<string, unknown>,
  opts?: { kind?: SeoLandingEntityKind; pageSlug?: string },
): SeoLandingFunnelUrls {
  const { serviceSlug, locationSlug } = resolveSeoLandingRoutingSlugs(draft, opts)
  const preferredCategory = serviceSlug ? getPreferredServiceCategoryUrlSlug(serviceSlug) : ''

  const booking =
    serviceSlug && locationSlug
      ? buildServiceLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? `/services/${preferredCategory}`
        : ''

  const nearMe =
    serviceSlug && locationSlug
      ? buildNearMeLocalityPublicPath(serviceSlug, locationSlug)
      : serviceSlug
        ? buildNearMeCategoryPublicPath(serviceSlug)
        : ''

  const emergency =
    serviceSlug && locationSlug ? buildEmergencyLocalityPublicPath(serviceSlug, locationSlug) : ''

  return {
    serviceSlug,
    locationSlug,
    preferredCategory,
    booking,
    nearMe,
    emergency,
    emergencyIsPrimaryCategory: serviceSlug ? isPrimaryEmergencyCategory(serviceSlug) : false,
  }
}
