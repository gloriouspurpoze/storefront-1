import {
  fetchStorefrontAnnouncement,
  fetchStorefrontBanners,
  fetchStorefrontOffers,
  type StorefrontConfig,
} from '@/lib/storefront-api'
import { resolveOfferPopup } from '@/lib/storefrontOffers'
import { pickPopupBanner, resolveAnnouncement } from '@/lib/storefrontContent'
import { isOfferMarqueeEnabled } from '@/lib/storefrontPaymentMethods'
import { createThemedAnnouncementBar, createThemedPopupBanner } from '@/theme-kit/content'
import './store-offers.css'

/**
 * Themes that load and render their own announcement bar + pop-up (see their
 * `load*StorefrontContent`). The shared layout skips them so offers never show twice.
 */
const THEMES_WITH_OWN_OFFERS = new Set(['menufast-cards', 'luxe-essence'])

/**
 * Verticals whose checkout redeems offers/coupons (product checkout). Home-services bookings and the
 * multi-seller marketplace have their own flows, so a code advertised there could not be used.
 */
const OFFER_CHECKOUT_VERTICALS = new Set(['retail', 'restaurant'])

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
  verticalKey,
}: {
  tenantId: string
  config: StorefrontConfig | null
  verticalKey?: string | null
}) {
  const offersRedeemable = OFFER_CHECKOUT_VERTICALS.has(verticalKey ?? '')
  if (themeRendersOwnOffers(config?.themeKey)) return null
  const marqueeOn = isOfferMarqueeEnabled(config)
  const [announcementRaw, popups, offers] = await Promise.all([
    marqueeOn ? fetchStorefrontAnnouncement(tenantId).catch(() => null) : Promise.resolve(null),
    fetchStorefrontBanners(tenantId, { bannerType: 'popup' }).catch(() => []),
    offersRedeemable ? fetchStorefrontOffers(tenantId).catch(() => []) : Promise.resolve([]),
  ])
  const announcement = resolveAnnouncement(announcementRaw, marqueeOn)
  // A tenant that features a code but publishes no popup banner still gets an offer popup.
  const { popup, offerCode } = resolveOfferPopup(pickPopupBanner(popups), offers)
  if (!announcement && !popup) return null
  return (
    <>
      {announcement ? <SharedAnnouncementBar data={announcement} /> : null}
      {popup ? (
        <SharedPopupBanner
          banner={popup}
          tenantId={tenantId}
          offerCode={offerCode}
        />
      ) : null}
    </>
  )
}
