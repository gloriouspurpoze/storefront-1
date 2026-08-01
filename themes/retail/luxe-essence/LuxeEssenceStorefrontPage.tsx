import type { StorefrontNavLink } from '@/lib/cms-content'
import type {
  PublicProduct,
  StorefrontConfig,
  StorefrontProductCategory,
} from '@/lib/storefront-api'
import {
  fetchStorefrontAnnouncement,
  fetchStorefrontBanners,
  fetchStorefrontSliders,
} from '@/lib/storefront-api'
import {
  filterActiveSliders,
  mergeSlidersById,
  pickPopupBanner,
  resolveAnnouncement,
} from '@/lib/storefrontContent'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'
import type { ThemeTenant } from '../types'
import type { LuxeEssenceStorefrontContent } from './luxeEssenceContentTypes'
import { LuxeEssencePage } from './LuxeEssencePage'

export type { LuxeEssenceStorefrontContent } from './luxeEssenceContentTypes'

export async function loadLuxeEssenceStorefrontContent(
  tenantId: string,
  config: StorefrontConfig | null,
): Promise<LuxeEssenceStorefrontContent> {
  const marqueeOn = isOfferMarqueeEnabled(config)

  const [offersRaw, promoRaw, heroRaw, seasonalRaw, announcementRaw, popupsRaw] =
    await Promise.all([
      fetchStorefrontSliders(tenantId, { placement: 'offers' }),
      fetchStorefrontSliders(tenantId, { placement: 'promo' }),
      // Admin default placement is often home_page_hero; include seasonal campaigns too.
      fetchStorefrontSliders(tenantId, { placement: 'home_page_hero' }),
      fetchStorefrontSliders(tenantId, { placement: 'seasonal' }),
      marqueeOn ? fetchStorefrontAnnouncement(tenantId) : Promise.resolve(null),
      fetchStorefrontBanners(tenantId, { bannerType: 'popup' }),
    ])

  return {
    announcement: resolveAnnouncement(announcementRaw, marqueeOn),
    offers: filterActiveSliders(mergeSlidersById(offersRaw, heroRaw, seasonalRaw)),
    promo: filterActiveSliders(promoRaw),
    popup: pickPopupBanner(popupsRaw),
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
}: {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
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
    />
  )
}

export { LuxeEssenceAnnouncementBar } from './content/LuxeEssenceAnnouncementBar'
export { LuxeEssenceOffersStrip } from './content/LuxeEssenceOffersStrip'
export { LuxeEssencePromoBlock } from './content/LuxeEssencePromoBlock'
export { LuxeEssencePopupBanner } from './content/LuxeEssencePopupBanner'
