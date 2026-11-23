import type { ReactNode } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type {
  PublicProduct,
  StorefrontConfig,
  StorefrontProductCategory,
} from '@/lib/storefront-api'
import {
  fetchStorefrontAnnouncement,
  fetchStorefrontBanners,
  fetchStorefrontOffers,
  fetchStorefrontSliders,
} from '@/lib/storefront-api'
import {
  filterActiveSliders,
  pickPopupBanner,
  resolveAnnouncement,
  resolveHomeSliderBuckets,
} from '@/lib/storefrontContent'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'
import { resolveOfferPopup } from '@/lib/storefrontOffers'
import type { ThemeTenant } from '../types'
import type { LuxeEssenceStorefrontContent } from './luxeEssenceContentTypes'
import { LuxeEssencePage } from './LuxeEssencePage'

export type { LuxeEssenceStorefrontContent } from './luxeEssenceContentTypes'

export async function loadLuxeEssenceStorefrontContent(
  tenantId: string,
  config: StorefrontConfig | null,
): Promise<LuxeEssenceStorefrontContent> {
  const marqueeOn = isOfferMarqueeEnabled(config)

  const [offersRaw, promoRaw, heroRaw, seasonalRaw, announcementRaw, popupsRaw, offersList] =
    await Promise.all([
      fetchStorefrontSliders(tenantId, { placement: 'offers' }),
      fetchStorefrontSliders(tenantId, { placement: 'promo' }),
      fetchStorefrontSliders(tenantId, { placement: 'home_page_hero' }),
      fetchStorefrontSliders(tenantId, { placement: 'seasonal' }),
      marqueeOn ? fetchStorefrontAnnouncement(tenantId) : Promise.resolve(null),
      fetchStorefrontBanners(tenantId, { bannerType: 'popup' }),
      fetchStorefrontOffers(tenantId).catch(() => []),
    ])
  const { popup, offerCode } = resolveOfferPopup(pickPopupBanner(popupsRaw), offersList)

  const { hero, offers } = resolveHomeSliderBuckets({
    offers: offersRaw,
    seasonal: seasonalRaw,
    homePageHero: heroRaw,
  })

  return {
    announcement: resolveAnnouncement(announcementRaw, marqueeOn),
    hero,
    offers,
    promo: filterActiveSliders(promoRaw),
    popup,
    popupOfferCode: offerCode,
  }
}

/** Server entry — fetches CMS sliders/banners then renders the client home page. */
export async function LuxeEssenceStorefrontPage({
  products,
  categories = [],
  tenant,
  config,
  navLinks,
  footerLinks,
  addonsSlot,
}: {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  /** Paid add-on homepage blocks, rendered above the footer. */
  addonsSlot?: ReactNode
}) {
  const content = await loadLuxeEssenceStorefrontContent(tenant.id, config)

  return (
    <LuxeEssencePage
      products={products}
      categories={categories}
      tenant={tenant}
      config={config}
      content={content}
      navLinks={navLinks}
      footerLinks={footerLinks}
      addonsSlot={addonsSlot}
    />
  )
}

export { LuxeEssenceAnnouncementBar } from './content/LuxeEssenceAnnouncementBar'
export { LuxeEssenceOffersStrip } from './content/LuxeEssenceOffersStrip'
export { LuxeEssencePromoBlock } from './content/LuxeEssencePromoBlock'
export { LuxeEssencePopupBanner } from './content/LuxeEssencePopupBanner'
