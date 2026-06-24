import { getPreferredServiceCategoryUrlSlug } from './serviceCatalogUrlSlugs'

/** CMS record key — `{service}__{location}` (not the public URL path). */
export function buildEmergencyCompositeSlug(serviceSlug: string, locationSlug: string): string {
  const svc = getPreferredServiceCategoryUrlSlug(serviceSlug)
  const loc = locationSlug.trim().toLowerCase()
  return `${svc}__${loc}`
}

export function parseEmergencyCompositeSlug(slug: string): { serviceSlug: string; locationSlug: string } | null {
  const normalized = slug.trim().toLowerCase()
  const idx = normalized.indexOf('__')
  if (idx <= 0 || idx >= normalized.length - 2) return null
  const serviceSlug = normalized.slice(0, idx)
  const locationSlug = normalized.slice(idx + 2)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(serviceSlug)) return null
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(locationSlug)) return null
  return { serviceSlug, locationSlug }
}

export function isValidEmergencyCompositeSlug(slug: string): boolean {
  return parseEmergencyCompositeSlug(slug) != null
}

export function publicEmergencyUrl(serviceSlug: string, locationSlug: string): string {
  const svc = getPreferredServiceCategoryUrlSlug(serviceSlug)
  const loc = locationSlug.trim().toLowerCase()
  return `/emergency/${svc}/${loc}`
}
