/**
 * SEO CMS category slugs vs Categories admin storage slugs (e.g. `ac` vs `ac-repair`).
 * Aligns with `serviceCatalogUrlSlugs.ts` / fixer-client path rules.
 */
import type { CmsCatalogCategoryOption } from '../constants/cmsCatalogCategories'
import {
  getPreferredServiceCategoryUrlSlug,
  getTreeSlugFromCatalogStorageSlug,
} from './serviceCatalogUrlSlugs'

export function seoCategorySlugAliases(storageSlug: string): string[] {
  const raw = storageSlug.trim().toLowerCase()
  if (!raw) return []
  const hyphen = raw.replace(/_/g, '-')
  const tree = getTreeSlugFromCatalogStorageSlug(raw)
  const preferred = getPreferredServiceCategoryUrlSlug(raw)
  return [...new Set([raw, hyphen, raw.replace(/-/g, '_'), tree, preferred])]
}

/** Picker options — value is the public/SEO slug (`ac-repair`), label from catalog. */
export function buildSeoCategoryPickerOptions(
  categories: CmsCatalogCategoryOption[],
): { value: string; label: string; hint?: string }[] {
  const byPreferred = new Map<string, { value: string; label: string; hint?: string }>()
  for (const o of categories) {
    const storage = o.value.trim().toLowerCase()
    const preferred = getPreferredServiceCategoryUrlSlug(storage)
    if (!byPreferred.has(preferred)) {
      byPreferred.set(preferred, {
        value: preferred,
        label: o.label,
        hint: storage !== preferred ? storage : storage,
      })
    }
  }
  return [...byPreferred.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function buildValidSeoCategorySlugSet(categories: CmsCatalogCategoryOption[]): Set<string> {
  const set = new Set<string>()
  for (const o of categories) {
    for (const alias of seoCategorySlugAliases(o.value)) {
      set.add(alias)
    }
  }
  return set
}

export function isValidSeoCategorySlug(
  slug: string,
  categories: CmsCatalogCategoryOption[],
): boolean {
  const raw = slug.trim().toLowerCase()
  if (!raw) return true
  if (categories.length === 0) return true
  const valid = buildValidSeoCategorySlugSet(categories)
  const hyphen = raw.replace(/_/g, '-')
  return valid.has(raw) || valid.has(hyphen)
}

/** Canonical SEO / consumer storage slug (e.g. `ac-repair`). */
export function normalizeSeoCategorySlug(slug: string): string {
  return getPreferredServiceCategoryUrlSlug(slug.trim().toLowerCase())
}

export function filterKnownSeoCategorySlugs(
  slugs: string[],
  categories: CmsCatalogCategoryOption[],
): string[] {
  if (categories.length === 0) return slugs.map((s) => s.trim().toLowerCase()).filter(Boolean)
  const valid = buildValidSeoCategorySlugSet(categories)
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of slugs) {
    const raw = s.trim().toLowerCase()
    if (!valid.has(raw)) continue
    const norm = normalizeSeoCategorySlug(raw)
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
  }
  return out
}

/** Slug to pass to `/platform-services/category/:slug` (catalog storage key). */
export function resolvePlatformCategoryApiSlug(
  slug: string,
  categories: CmsCatalogCategoryOption[],
): string {
  const raw = slug.trim().toLowerCase()
  if (!raw) return raw
  for (const o of categories) {
    if (o.value.trim().toLowerCase() === raw) return o.value.trim().toLowerCase()
  }
  const preferred = normalizeSeoCategorySlug(raw)
  for (const o of categories) {
    if (normalizeSeoCategorySlug(o.value) === preferred) {
      return o.value.trim().toLowerCase()
    }
  }
  return getTreeSlugFromCatalogStorageSlug(raw)
}
