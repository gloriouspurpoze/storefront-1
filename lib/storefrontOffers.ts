import type { StorefrontBanner, StorefrontOffer } from '@/lib/storefront-api'

const inr = (n: number) => `₹${Math.round(n * 100) % 100 === 0 ? Math.round(n) : n.toFixed(2)}`

/** One-line, shopper-facing summary of an offer ("Buy 2 get 1 free", "20% off up to ₹500"). */
export function describeOffer(offer: StorefrontOffer): string {
  const above = offer.minOrderAmount > 0 ? ` on orders above ${inr(offer.minOrderAmount)}` : ''
  switch (offer.discountType) {
    case 'buy_one_get_one': {
      const b = offer.bogo
      return b ? `Buy ${b.buyQty} get ${b.getQty} free` : 'Buy more, get free items'
    }
    case 'free_shipping':
      return `Free shipping${above}`
    case 'fixed':
      return `${inr(offer.discountValue)} off${above}`
    case 'percentage': {
      const cap = offer.maxDiscount ? ` up to ${inr(offer.maxDiscount)}` : ''
      return `${offer.discountValue}% off${cap}${above}`
    }
    default: {
      const top = [...(offer.spendTiers ?? [])].sort((a, b) => b.minSpend - a.minSpend)[0]
      return top ? `Spend ${inr(top.minSpend)}, save more` : offer.name
    }
  }
}

/** First featured offer that has a code to show (tenants opt in by featuring it). */
export function pickFeaturedCodeOffer(offers: StorefrontOffer[]): StorefrontOffer | null {
  return offers.find((o) => o.featured && o.applicationType === 'code' && !!o.code) ?? null
}

/** Code a popup banner should advertise: the banner's own `settings.couponCode`, else the featured offer's. */
export function popupOfferCode(
  banner: StorefrontBanner | null,
  offers: StorefrontOffer[],
): string | undefined {
  const fromBanner = banner?.settings?.couponCode
  if (typeof fromBanner === 'string' && fromBanner.trim()) return fromBanner.trim().toUpperCase()
  return pickFeaturedCodeOffer(offers)?.code
}

/** Popup built from an offer alone, for tenants that feature a code but publish no popup banner. */
export function offerToPopupBanner(offer: StorefrontOffer): StorefrontBanner {
  return {
    id: `offer:${offer.id}`,
    title: offer.name,
    description: offer.description?.trim() || describeOffer(offer),
    bannerType: 'popup',
    position: 'popup',
    images: { desktop: offer.image ?? '' },
    cta: { text: 'Shop now', link: '/products' },
  }
}

/**
 * Popup + code to render: the tenant's popup banner (or an offer-only popup when they feature a
 * code but publish no banner), with the code to advertise.
 */
export function resolveOfferPopup(
  banner: StorefrontBanner | null,
  offers: StorefrontOffer[],
): { popup: StorefrontBanner | null; offerCode?: string } {
  const featured = pickFeaturedCodeOffer(offers)
  const popup = banner ?? (featured ? offerToPopupBanner(featured) : null)
  return { popup, offerCode: popup ? popupOfferCode(banner, offers) : undefined }
}
