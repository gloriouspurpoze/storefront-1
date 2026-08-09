import type { StorefrontBanner, StorefrontSlider } from '@/lib/storefront-api'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'

export type MenuFastCardsStorefrontContent = {
  announcement: ResolvedAnnouncement | null
  /** Home Page Hero placement — media under studio hero copy. */
  hero: StorefrontSlider[]
  /** Offers & Promotions ∪ Seasonal — strip below hero. */
  offers: StorefrontSlider[]
  promo: StorefrontSlider[]
  popup: StorefrontBanner | null
}
