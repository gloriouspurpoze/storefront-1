import type { ReactNode } from 'react'
import type { StorefrontSlider } from '@/lib/storefront-api'
import type { HomeCarousels } from '@/lib/homeCarousels'
import { HeroCarousel } from '@/components/sections/HeroCarousel'
import { buildHeroSlides } from '@/components/sections/slides'
import { createThemedPromoBlock } from '@/theme-kit/content'
import { SharedOffersStrip } from './SharedOffersStrip'
import './home-carousels.css'

// Shared `sfo` skin (see home-carousels.css) for themes without their own carousel UI.
// The offers strip is a client component (SharedOffersStrip); the promo block is server-safe.
const SharedPromoBlock = createThemedPromoBlock('sfo')

/** Admin hero slides as the shared full-bleed carousel; null when none are live. */
export function HomeHeroCarousel({ slides }: { slides: StorefrontSlider[] }) {
  if (!slides.length) return null
  // Live slides always map 1:1; the fallback copy below is never used.
  const heroSlides = buildHeroSlides(slides, null, { title: '', ctaLabel: '', ctaHref: '/' })
  return (
    <div className="sfo-hero" data-storefront-carousel="hero">
      <HeroCarousel slides={heroSlides} />
    </div>
  )
}

/** Offers strip + inline promo block, rendered below a theme's hero. */
export function HomeCarouselSection({ offers, promo }: Pick<HomeCarousels, 'offers' | 'promo'>) {
  if (!offers.length && !promo.length) return null
  return (
    <div className="sfo-carousels" data-storefront-carousel="offers">
      <div className="sfo-wrap">
        <SharedOffersStrip slides={offers} />
        <SharedPromoBlock slides={promo} />
      </div>
    </div>
  )
}

/** Category / product promo slides (`store_category`, `product_page`). */
export function PlacementPromo({ slides, label }: { slides: StorefrontSlider[]; label?: string }) {
  if (!slides.length) return null
  return (
    <div className="sfo-placement" data-storefront-carousel={label ?? 'placement'}>
      {slides.length > 1 ? <SharedOffersStrip slides={slides} /> : <SharedPromoBlock slides={slides} />}
    </div>
  )
}

/**
 * Slot props every home template accepts (like `addonsSlot`):
 *   heroSlot     → replaces the theme's built-in hero (undefined = keep the theme hero)
 *   carouselSlot → offers strip + promo, placed right after the hero
 */
export type HomeCarouselSlots = { heroSlot?: ReactNode; carouselSlot?: ReactNode }

export function homeCarouselSlots(c: HomeCarousels): HomeCarouselSlots {
  return {
    heroSlot: c.hero.length ? <HomeHeroCarousel slides={c.hero} /> : undefined,
    carouselSlot:
      c.offers.length || c.promo.length ? <HomeCarouselSection offers={c.offers} promo={c.promo} /> : undefined,
  }
}
