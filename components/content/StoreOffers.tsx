import { fetchStorefrontAnnouncement, fetchStorefrontBanners, type StorefrontConfig } from '@/lib/storefront-api'
import { pickPopupBanner, resolveAnnouncement } from '@/lib/storefrontContent'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'
import { createThemedAnnouncementBar, createThemedPopupBanner } from '@/theme-kit/content'
import './store-offers.css'

/**
 * Themes that load and render their own announcement bar + pop-up (see their
 * `load*StorefrontContent`). The shared layout skips them so offers never show twice.
 */
const THEMES_WITH_OWN_OFFERS = new Set(['menufast-cards', 'luxe-essence'])

export function themeRendersOwnOffers(themeKey: string | null | undefined): boolean {
  return THEMES_WITH_OWN_OFFERS.has(themeKey ?? '')
}

// `sfo` (storefront offers) — not `sf`, which would collide with the base `sf-announcement` shell class.
const SharedAnnouncementBar = createThemedAnnouncementBar('sfo')
const SharedPopupBanner = createThemedPopupBanner('sfo')

/**
 * Admin "Marketing → Coupons & banners" offers for every theme: the top announcement
 * bar (respects the `showOfferMarquee` flag + schedule) and the session-dismissible
 * pop-up banner. Server component; both reads are tag-cached by the API helpers.
 */
export async function StoreOffers({
  tenantId,
  config,
}: {
  tenantId: string
  config: StorefrontConfig | null
}) {
  if (themeRendersOwnOffers(config?.themeKey)) return null
  const marqueeOn = isOfferMarqueeEnabled(config)
  const [announcementRaw, popups] = await Promise.all([
    marqueeOn ? fetchStorefrontAnnouncement(tenantId).catch(() => null) : Promise.resolve(null),
    fetchStorefrontBanners(tenantId, { bannerType: 'popup' }).catch(() => []),
  ])
  const announcement = resolveAnnouncement(announcementRaw, marqueeOn)
  const popup = pickPopupBanner(popups)
  if (!announcement && !popup) return null
  return (
    <>
      {announcement ? <SharedAnnouncementBar data={announcement} /> : null}
      {popup ? <SharedPopupBanner banner={popup} tenantId={tenantId} /> : null}
    </>
  )
}
