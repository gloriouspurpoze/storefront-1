import type { StorefrontBanner, StorefrontSlider } from '@/lib/storefront-api'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'

export type LuxeEssenceStorefrontContent = {
  announcement: ResolvedAnnouncement | null
  offers: StorefrontSlider[]
  promo: StorefrontSlider[]
  popup: StorefrontBanner | null
}
