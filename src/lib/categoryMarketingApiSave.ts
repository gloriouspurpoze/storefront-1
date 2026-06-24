import type { CategoryMarketingConfig, SparePartRow } from '../types/categoryMarketing'
import { mergeCategoryConfig } from '../types/categoryMarketing'
import { cmsMarketingPricingMirrorKeys } from './categoryMarketingCatalogKeys'

export type CategoryMarketingPricingPatch = Pick<
  CategoryMarketingConfig,
  'spareParts' | 'comparisonRows' | 'pricingIncluded' | 'pricingExcluded' | 'pricingHeading'
>

function cleanSpareParts(rows: SparePartRow[]): SparePartRow[] {
  return rows
    .map((r) => ({
      name: String(r.name ?? '').trim(),
      priceRange: String(r.priceRange ?? '').trim(),
    }))
    .filter((r) => r.name.length > 0)
}

/** Normalize pricing arrays before PUT so the API receives explicit fields. */
export function prepareCategoryMarketingSliceForApi(
  config: CategoryMarketingConfig,
): CategoryMarketingConfig {
  const merged = mergeCategoryConfig(config)
  return {
    ...merged,
    spareParts: cleanSpareParts(merged.spareParts),
    pricingIncluded: merged.pricingIncluded.map((l) => String(l ?? '').trim()).filter(Boolean),
    pricingExcluded: merged.pricingExcluded.map((l) => String(l ?? '').trim()).filter(Boolean),
    comparisonRows: merged.comparisonRows
      .map((r) => ({
        label: String(r.label ?? '').trim(),
        profixer: String(r.profixer ?? '').trim(),
        others: String(r.others ?? '').trim(),
      }))
      .filter((r) => r.label.length > 0),
  }
}

/**
 * Merge pricing patch into all CMS alias keys the consumer reads, preserving other fields per key.
 */
export function applyPricingPatchToCategoryMarketingBlob(
  blob: Record<string, CategoryMarketingConfig>,
  catalogSlug: string,
  patch: CategoryMarketingPricingPatch,
  localitySlug?: string | null,
): Record<string, CategoryMarketingConfig> {
  const next = { ...blob }
  const cleanPatch: CategoryMarketingPricingPatch = {
    ...patch,
    spareParts: patch.spareParts ? cleanSpareParts(patch.spareParts) : undefined,
  }
  for (const key of cmsMarketingPricingMirrorKeys(catalogSlug, localitySlug)) {
    const base = prepareCategoryMarketingSliceForApi(next[key] ?? {})
    next[key] = prepareCategoryMarketingSliceForApi({
      ...base,
      ...cleanPatch,
      spareParts: cleanPatch.spareParts ?? base.spareParts,
    })
  }
  return next
}
