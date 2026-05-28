import { useCallback, useEffect, useState } from 'react'
import { CMSService } from '../services/api'

/**
 * Per-locality SEO quality signals. Mirrors the user-site's
 * `LocalityQualitySignals` registry (see `src/shared/lib/seo/localityRegistry.ts`
 * in the consumer repo). When all hard signals pass + `contentQualityScore >=
 * LOCALITY_QUALITY_FLOOR`, the locality enters per-category sitemaps. Keep
 * fields permissive so the backend can stay forward-compatible.
 */
export type LocalityQualitySignals = {
  /** Real verified providers available for at least one industry. */
  providerAvailability?: boolean
  /** Has real customer reviews (count or boolean both acceptable). */
  reviewCount?: boolean | number
  /** Has unique CMS content (i.e. localityGuide.enabled === true for ≥1 pair). */
  hasUniqueContent?: boolean
  /** Has ≥3 locality-specific FAQs. */
  faqCoverage?: boolean
  /** Has localized pricing band visible on the page. */
  hasPricingInfo?: boolean
  /** Has measurable organic search demand (Mumbai-wide or area-specific). */
  searchDemand?: boolean
  /** Composite editorial-quality score (0–1). 0.7+ recommended for indexing. */
  contentQualityScore?: number
}

export type ServiceCatalogLocalityRow = {
  _id: string
  slug: string
  name: string
  sortOrder: number
  isActive: boolean
  /** Parent city / metro (e.g. "Mumbai", "Thane", "Navi Mumbai"). */
  parentCity?: string
  /** Real neighborhood names inside the locality (e.g. ["Mira Road East", "Bhayandar West"]). */
  neighborhoods?: string[]
  /** Notable housing societies / complexes (e.g. ["Cosmos Lounge", "Royal Palms"]). */
  societies?: string[]
  /** Hyperlocal infrastructure facts editors must reference in CMS copy. */
  infrastructureFacts?: string[]
  /**
   * SEO-side gate: when false the locality is REMOVED from per-category sitemaps
   * even though `isActive` may keep the URL reachable (200) for direct hits.
   * Use this for soft pruning low-quality areas before deactivating routes.
   */
  isIndexable?: boolean
  qualitySignals?: LocalityQualitySignals
  createdAt?: string
  updatedAt?: string
}

export function useServiceCatalogLocalities() {
  const [rows, setRows] = useState<ServiceCatalogLocalityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CMSService.listServiceCatalogLocalities()
      setRows(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load localities'
      setError(msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { rows, loading, error, refresh }
}
