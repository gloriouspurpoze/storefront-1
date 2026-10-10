import type { MarketplaceListingQuery, MarketplaceSort } from '@/lib/marketplace-api'

/** The URL-driven subset of a listing query (what facet links and pagination rewrite). */
export interface CatalogQuery {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: MarketplaceSort
  page?: number
}

const SORTS: MarketplaceSort[] = ['relevance', 'price_asc', 'price_desc', 'newest', 'rating']

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function positiveInt(v: string | undefined): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

/** Next `searchParams` → validated catalog query (junk values are dropped, not trusted). */
export function parseCatalogQuery(sp: Record<string, string | string[] | undefined>): CatalogQuery {
  const sort = first(sp.sort)
  return {
    q: first(sp.q)?.trim().slice(0, 120) || undefined,
    category: first(sp.category)?.trim().toLowerCase().slice(0, 120) || undefined,
    minPrice: positiveInt(first(sp.minPrice)),
    maxPrice: positiveInt(first(sp.maxPrice)),
    sort: SORTS.includes(sort as MarketplaceSort) ? (sort as MarketplaceSort) : undefined,
    page: positiveInt(first(sp.page)),
  }
}

/**
 * Link for a catalog page with `patch` applied. Any filter change resets to page 1;
 * `undefined` in the patch removes that key.
 */
export function catalogHref(basePath: string, current: CatalogQuery, patch: Partial<CatalogQuery>): string {
  const next: CatalogQuery = { ...current, ...patch }
  if (!('page' in patch)) next.page = undefined
  const params = new URLSearchParams()
  if (next.q) params.set('q', next.q)
  if (next.category) params.set('category', next.category)
  if (next.minPrice) params.set('minPrice', String(next.minPrice))
  if (next.maxPrice) params.set('maxPrice', String(next.maxPrice))
  if (next.sort && next.sort !== 'relevance') params.set('sort', next.sort)
  if (next.page && next.page > 1) params.set('page', String(next.page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function toListingQuery(q: CatalogQuery, extra: Partial<MarketplaceListingQuery> = {}): MarketplaceListingQuery {
  return { ...q, limit: 24, facets: true, ...extra }
}

/** Four price bands rounded to "nice" steps across the facet range (empty when too narrow). */
export function priceBands(range: { min: number; max: number }): Array<{ min?: number; max?: number }> {
  const { min, max } = range
  if (!max || max - min < 100) return []
  const raw = (max - min) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = Math.ceil(raw / magnitude) * magnitude
  const start = Math.floor(min / magnitude) * magnitude
  return [0, 1, 2, 3].map((i) => ({
    min: i === 0 ? undefined : start + i * step,
    max: i === 3 ? undefined : start + (i + 1) * step,
  }))
}
