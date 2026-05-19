/**
 * Must stay aligned with fixer-client `src/shared/lib/paths.ts` URL slug rules.
 * CMS storage keys (e.g. `electric`) may differ from public paths (`/services/electrician/...`).
 */

const URL_SLUG_TO_TREE_SLUG: Record<string, string> = {
  electrical: 'electrician',
  electrician: 'electrician',
  plumbing: 'plumber',
  plumber: 'plumber',
  'ac-services': 'ac',
  'ac-repair': 'ac',
  ac: 'ac',
}

const TREE_SLUG_TO_URL_SLUG: Record<string, string> = {
  electrician: 'electrician',
  plumber: 'plumber',
  ac: 'ac-repair',
}

export function getTreeSlugFromCatalogStorageSlug(slug: string): string {
  const key = slug.trim().toLowerCase()
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
