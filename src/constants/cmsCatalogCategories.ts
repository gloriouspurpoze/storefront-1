  /**
 * CMS catalog keys (Rate Card, Category Marketing, Cross-Linking) use the same slug as **root service categories**
 * from Categories. Pull options via `useCmsCatalogCategories()` — do not hardcode verticals here.
 *
 * Hyperlocal CMS keys: `{industrySlug}__{localitySlug}` — the separator is exactly `__` (two underscores),
 * e.g. `electric__mira-road` (not `electric_mira-road`).
 */

import type { Category } from '../types'

export const CMS_DEFAULT_FALLBACK_SLUG = 'default' as const

export type CmsCatalogCategoryOption = {
  value: string
  label: string
}

function getCategoryId(c: Category): string {
  return c.id ?? (c as { _id?: string })._id ?? ''
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Build select options from service (+ both) categories: one entry per **root** slug, sorted by label.
 * Appends {@link CMS_DEFAULT_FALLBACK_SLUG} for legacy CMS JSON that used a catch-all key.
 */
export function buildCmsCatalogOptionsFromCategories(categories: Category[]): CmsCatalogCategoryOption[] {
  const rows = (categories || [])
    .map((c) => {
      const id = getCategoryId(c)
      const name = (c.name ?? '').toString().trim()
      const parent = (c.parentId ?? c.parent_id ?? '').toString().trim()
      const rawSlug = (c.slug ?? '').toString().trim()
      const slug = rawSlug || slugFromName(name)
      return { id, name, parent, slug }
    })
    .filter((r) => r.id && r.name && r.slug)

  const roots = rows.filter((r) => !r.parent)
  const bySlug = new Map<string, string>()
  for (const r of roots) {
    if (!bySlug.has(r.slug)) {
      bySlug.set(r.slug, r.name)
    }
  }

  const opts: CmsCatalogCategoryOption[] = Array.from(bySlug.entries()).map(([value, label]) => ({
    value,
    label,
  }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

  const hasDefault = bySlug.has(CMS_DEFAULT_FALLBACK_SLUG)
  if (!hasDefault) {
    opts.push({
      value: CMS_DEFAULT_FALLBACK_SLUG,
      label: 'Default (other categories)',
    })
  }

  return opts.length > 0
    ? opts
    : [{ value: CMS_DEFAULT_FALLBACK_SLUG, label: 'Default (other categories)' }]
}
