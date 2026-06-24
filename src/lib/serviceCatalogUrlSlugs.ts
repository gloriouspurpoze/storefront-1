/**
 * Must stay aligned with fixer-client `src/shared/lib/paths.ts` URL slug rules.
 * CMS storage keys (e.g. `electric`, `appliance`) may differ from public paths
 * (`/services/electrician/...`, `/services/appliance-repair/...`).
 */

const URL_SLUG_TO_TREE_SLUG: Record<string, string> = {
  electrical: 'electrician',
  electrician: 'electrician',
  plumbing: 'plumber',
  plumber: 'plumber',
  'ac-services': 'ac',
  'ac-service': 'ac',
  'ac-repair': 'ac',
  ac: 'ac',
  appliance: 'appliance',
  'appliance-repair': 'appliance',
}

const TREE_SLUG_TO_URL_SLUG: Record<string, string> = {
  electrician: 'electrician',
  plumber: 'plumber',
  ac: 'ac-repair',
  appliance: 'appliance-repair',
}

function normalizeSlugKey(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, '-')
}

export function getTreeSlugFromCatalogStorageSlug(slug: string): string {
  const key = normalizeSlugKey(slug)
  return URL_SLUG_TO_TREE_SLUG[key] ?? key
}

/** Canonical `/services/{segment}` slug — matches fixer-client `getPreferredCategoryUrlSlug`. */
export function getPreferredServiceCategoryUrlSlug(storageOrUrlSlug: string): string {
  const treeSlug = getTreeSlugFromCatalogStorageSlug(storageOrUrlSlug)
  return TREE_SLUG_TO_URL_SLUG[treeSlug] ?? treeSlug
}

export function isPreferredServiceCategoryUrlSlug(slug: string): boolean {
  const raw = slug.trim().toLowerCase()
  return getPreferredServiceCategoryUrlSlug(raw) === raw
}

export function buildServiceLocalityPublicPath(storageSlug: string, localitySlug: string): string {
  const preferred = getPreferredServiceCategoryUrlSlug(storageSlug)
  const loc = localitySlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
  return `/services/${preferred}/${loc}`
}

/** Pre-generated in consumer sitemap (`buildEmergencySitemapEntries`). */
export const EMERGENCY_PROGRAMMATIC_CATEGORIES = ['ac-repair', 'electrician', 'plumber'] as const

export function buildEmergencyLocalityPublicPath(storageSlug: string, localitySlug: string): string {
  const preferred = getPreferredServiceCategoryUrlSlug(storageSlug)
  const loc = localitySlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
  return `/emergency/${preferred}/${loc}`
}

export function isPrimaryEmergencyCategory(storageSlug: string): boolean {
  const preferred = getPreferredServiceCategoryUrlSlug(storageSlug)
  return (EMERGENCY_PROGRAMMATIC_CATEGORIES as readonly string[]).includes(preferred)
}
