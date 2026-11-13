import { fetchStorefrontSliders, type StorefrontSlider } from './storefront-api'
import { filterActiveSliders, mergeSlidersById } from './storefrontContent'

/**
 * Admin "Marketing → Coupons & banners → Carousels" placements, bucketed for the
 * storefront. One API read per page (all placements), then split locally.
 *
 *   home_page_hero  → `hero`   (replaces a theme's built-in hero while slides are live)
 *   offers/seasonal → `offers` (strip below the hero)
 *   promo           → `promo`  (inline block below the offers strip)
 *
 * Slides saved without a placement are legacy hero slides (the admin default), so they go
 * to `hero` only — never repeated in every bucket.
 */
export type HomeCarousels = {
  hero: StorefrontSlider[]
  offers: StorefrontSlider[]
  promo: StorefrontSlider[]
}

export const EMPTY_HOME_CAROUSELS: HomeCarousels = { hero: [], offers: [], promo: [] }

/** Themes whose own loaders already render hero/offers/promo slides (no shared slots). */
const THEMES_WITH_OWN_CAROUSELS = new Set(['menufast-cards', 'luxe-essence'])

export function themeRendersOwnCarousels(themeKey: string | null | undefined): boolean {
  return THEMES_WITH_OWN_CAROUSELS.has(themeKey ?? '')
}

export function bucketHomeCarousels(slides: StorefrontSlider[], now: Date = new Date()): HomeCarousels {
  const live = filterActiveSliders(slides, now)
  const of = (...placements: string[]) => live.filter((s) => placements.includes(s.placement ?? ''))
  return {
    hero: live.filter((s) => !s.placement || s.placement === 'home_page_hero'),
    offers: mergeSlidersById(of('offers'), of('seasonal')),
    promo: of('promo'),
  }
}

export async function loadHomeCarousels(
  tenantId: string,
  themeKey: string | null | undefined,
): Promise<HomeCarousels> {
  if (themeRendersOwnCarousels(themeKey)) return EMPTY_HOME_CAROUSELS
  const slides = await fetchStorefrontSliders(tenantId).catch(() => [])
  return bucketHomeCarousels(slides)
}

/**
 * Page-level promo slides: `store_category` above a product aisle, `product_page` on a
 * product detail page. The API matches slides targeted at this slug plus untargeted ones.
 */
export async function loadPlacementSlides(
  tenantId: string,
  placement: 'store_category' | 'product_page',
  slug: string,
): Promise<StorefrontSlider[]> {
  const slides = await fetchStorefrontSliders(tenantId, {
    placement,
    ...(placement === 'store_category' ? { category_slug: slug } : { product_slug: slug }),
  }).catch(() => [])
  // The API also returns placement-less (legacy hero) slides for any placement filter.
  return filterActiveSliders(slides.filter((s) => s.placement === placement))
}
