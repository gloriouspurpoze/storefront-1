import type { PublicMenuCategory, StorefrontConfig } from '@/lib/storefront-api'
import {
  fetchCategoryMarketing,
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
import { normalizeCategoryMarketingRecord } from '@/lib/categoryMarketing'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'
import type { ThemeTenant } from '../types'
import type { MenuFastCardsStorefrontContent } from './menuFastCardsContentTypes'
import { MenuFastCardsPage } from './MenuFastCardsPage'
import { Suspense } from 'react'

export type { MenuFastCardsStorefrontContent } from './menuFastCardsContentTypes'

export async function loadMenuFastCardsStorefrontContent(
  tenantId: string,
  config: StorefrontConfig | null,
): Promise<MenuFastCardsStorefrontContent> {
  const marqueeOn = isOfferMarqueeEnabled(config)

  const [offersRaw, promoRaw, heroRaw, seasonalRaw, announcementRaw, popupsRaw] =
    await Promise.all([
      fetchStorefrontSliders(tenantId, { placement: 'offers' }),
      fetchStorefrontSliders(tenantId, { placement: 'promo' }),
      // Admin default placement is home_page_hero; seasonal campaigns are common for promos.
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

/** Server entry — fetches CMS content then renders the client menu page. */
export async function MenuFastCardsStorefrontPage({
  initialCategories,
  tenant,
  config,
}: {
  initialCategories: PublicMenuCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const [content, categoryMarketingRaw] = await Promise.all([
    loadMenuFastCardsStorefrontContent(tenant.id, config),
    fetchCategoryMarketing(tenant.id),
  ])
  const categoryMarketing = normalizeCategoryMarketingRecord(categoryMarketingRaw)

  return (
    <Suspense fallback={null}>
      <MenuFastCardsPage
        initialCategories={initialCategories}
        tenant={tenant}
        config={config}
        content={content}
        categoryMarketing={categoryMarketing}
      />
    </Suspense>
  )
}

export { MenuFastCardsAnnouncementBar } from './content/MenuFastCardsAnnouncementBar'
export { MenuFastCardsOffersStrip } from './content/MenuFastCardsOffersStrip'
export { MenuFastCardsPromoBlock } from './content/MenuFastCardsPromoBlock'
export { MenuFastCardsPopupBanner } from './content/MenuFastCardsPopupBanner'
