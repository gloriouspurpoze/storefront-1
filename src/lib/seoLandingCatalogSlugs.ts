/**
 * SEO CMS category slugs vs Categories admin storage slugs (e.g. `ac` vs `ac-repair`).
 * Aligns with `serviceCatalogUrlSlugs.ts` / fixer-client path rules.
 */
import type { CmsCatalogCategoryOption } from '../constants/cmsCatalogCategories'
import { platformServicesService } from '../services/api/platformServices.service'
import {
  getPreferredServiceCategoryUrlSlug,
  getTreeSlugFromCatalogStorageSlug,
} from './serviceCatalogUrlSlugs'

import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import { SEO_LANDING_KINDS } from './seoLandingPageKinds'

export type SeoLandingRecordsByKind = Partial<
  Record<SeoLandingEntityKind, Record<string, Record<string, unknown>>>
>

export function seoLandingKindHasCategoryFilter(kind: SeoLandingEntityKind): boolean {
  return kind !== 'locations'
}

/** Normalized industry category slugs assigned to a page (serviceSlug or servicesOffered). */
export function getSeoPageCategorySlugs(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): string[] {
  if (kind === 'locations') return []
  if (kind === 'providers') {
    const offered = Array.isArray(draft.servicesOffered) ? draft.servicesOffered.map(String) : []
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of offered) {
      const n = normalizeSeoCategorySlug(s.trim())
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push(n)
    }
    return out
  }
  const slug = String(draft.serviceSlug ?? draft.service ?? '').trim()
  return slug ? [normalizeSeoCategorySlug(slug)] : []
}

export function seoPageMatchesCategoryFilter(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  filterCategory: string,
): boolean {
  const filter = filterCategory.trim()
  if (!filter) return true
  if (filter === '__uncategorized__') {
    return getSeoPageCategorySlugs(kind, draft).length === 0
  }
  const filterNorm = normalizeSeoCategorySlug(filter)
  return getSeoPageCategorySlugs(kind, draft).some((c) => c === filterNorm)
}

/** Count pages in one kind matching the category filter (empty filter = all pages). */
export function countSeoPagesForKindAndCategory(
  kind: SeoLandingEntityKind,
  records: Record<string, Record<string, unknown>>,
  categoryFilter: string,
): number {
  if (!categoryFilter.trim()) return Object.keys(records).length
  return Object.values(records).filter((d) => seoPageMatchesCategoryFilter(kind, d, categoryFilter)).length
}

/** Category filter dropdown — counts across problems, charges, guides, providers & landing pages. */
export function buildGlobalSeoCategoryFilterOptions(
  recordsByKind: SeoLandingRecordsByKind,
  catalogCuratedOptions: { value: string; label: string; hint?: string }[],
  catalogLabelMap: Record<string, string>,
): { value: string; label: string; hint: string }[] {
  const counts = new Map<string, number>()
  let uncategorized = 0

  for (const k of SEO_LANDING_KINDS) {
    if (!seoLandingKindHasCategoryFilter(k.id)) continue
    const records = recordsByKind[k.id] ?? {}
    for (const d of Object.values(records)) {
      const cats = getSeoPageCategorySlugs(k.id, d)
      if (cats.length === 0) {
        uncategorized++
      } else {
        const seen = new Set<string>()
        for (const c of cats) {
          if (seen.has(c)) continue
          seen.add(c)
          counts.set(c, (counts.get(c) ?? 0) + 1)
        }
      }
    }
  }

  const opts: { value: string; label: string; hint: string }[] = catalogCuratedOptions.map((o) => ({
    value: o.value,
    label: o.label,
    hint: String(counts.get(o.value) ?? 0),
  }))

  for (const [c, n] of counts) {
    if (!opts.some((o) => o.value === c)) {
      opts.push({ value: c, label: catalogLabelMap[c] ?? c, hint: String(n) })
    }
  }

  opts.sort((a, b) => {
    const na = Number.parseInt(a.hint, 10) || 0
    const nb = Number.parseInt(b.hint, 10) || 0
    if (nb !== na) return nb - na
    return a.label.localeCompare(b.label)
  })

  if (uncategorized > 0) {
    opts.push({ value: '__uncategorized__', label: 'Uncategorized', hint: String(uncategorized) })
  }

  return opts
}

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

/** Load bookable platform services for an SEO category slug (id + slug fallbacks). */
export async function fetchPlatformServicesForSeoCategory(
  slug: string,
  catalogOptions: CmsCatalogCategoryOption[],
  categoryRecords?: { id?: string; slug?: string }[],
) {
  const keys = buildPlatformCategoryFetchKeys(slug, catalogOptions, categoryRecords)
  return platformServicesService.listServicesForCategoryKeys(keys)
}

/** Keys to try when loading platform services (id, storage slug, SEO slug, tree slug). */
export function buildPlatformCategoryFetchKeys(
  slug: string,
  catalogOptions: CmsCatalogCategoryOption[],
  categoryRecords?: { id?: string; slug?: string }[],
): string[] {
  const raw = slug.trim().toLowerCase()
  if (!raw) return []
  const preferred = normalizeSeoCategorySlug(raw)
  const storage = resolvePlatformCategoryApiSlug(raw, catalogOptions)
  const tree = getTreeSlugFromCatalogStorageSlug(raw)
  const keys = new Set<string>()

  for (const rec of categoryRecords ?? []) {
    const id = String(rec.id ?? '').trim()
    const recSlug = String(rec.slug ?? '').trim().toLowerCase()
    const recPreferred = recSlug ? normalizeSeoCategorySlug(recSlug) : ''
    const matches =
      recSlug === raw ||
      recSlug === storage ||
      recPreferred === preferred ||
      recSlug === preferred ||
      recSlug === tree
    if (matches) {
      if (id) keys.add(id)
      if (recSlug) keys.add(recSlug)
    }
  }

  for (const k of [storage, preferred, raw, tree, raw.replace(/_/g, '-')]) {
    if (k) keys.add(k)
  }
  return [...keys]
}
