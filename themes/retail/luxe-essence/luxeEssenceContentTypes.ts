import type { StorefrontBanner, StorefrontSlider } from '@/lib/storefront-api'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'

export type LuxeEssenceStorefrontContent = {
  announcement: ResolvedAnnouncement | null
  /** Home Page Hero placement — media carousel in the hero (not offers strip). */
  hero: StorefrontSlider[]
  /** Offers & Promotions ∪ Seasonal — strip below hero. */
  offers: StorefrontSlider[]
  promo: StorefrontSlider[]
  popup: StorefrontBanner | null
}
