import { describe, expect, it } from 'vitest'
import type { StorefrontBanner, StorefrontOffer } from '../storefront-api'
import { describeOffer, offerToPopupBanner, pickFeaturedCodeOffer, popupOfferCode } from '../storefrontOffers'

const offer = (over: Partial<StorefrontOffer>): StorefrontOffer => ({
  id: 'o1',
  name: 'Offer',
  applicationType: 'code',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  spendTiers: [],
  featured: false,
  ...over,
})

describe('describeOffer', () => {
  it('describes buy X get Y free', () => {
    expect(describeOffer(offer({ discountType: 'buy_one_get_one', bogo: { buyQty: 2, getQty: 1 } }))).toBe(
      'Buy 2 get 1 free',
    )
  })
  it('describes percentage with cap and minimum', () => {
    expect(describeOffer(offer({ discountValue: 20, maxDiscount: 500, minOrderAmount: 999 }))).toBe(
      '20% off up to ₹500 on orders above ₹999',
    )
  })
  it('describes flat and free shipping', () => {
    expect(describeOffer(offer({ discountType: 'fixed', discountValue: 100 }))).toBe('₹100 off')
    expect(describeOffer(offer({ discountType: 'free_shipping', minOrderAmount: 499 }))).toBe(
      'Free shipping on orders above ₹499',
    )
  })
})

describe('popup offer selection', () => {
  const featured = offer({ id: 'f', featured: true, code: 'SAVE10' })
  it('only picks featured code offers that have a code', () => {
    expect(pickFeaturedCodeOffer([offer({ code: 'HIDDEN' }), featured])?.id).toBe('f')
    expect(pickFeaturedCodeOffer([offer({ featured: true, applicationType: 'auto' })])).toBeNull()
  })
  it('prefers the banner code over the featured offer', () => {
    const banner = { settings: { couponCode: ' diwali ' } } as unknown as StorefrontBanner
    expect(popupOfferCode(banner, [featured])).toBe('DIWALI')
    expect(popupOfferCode(null, [featured])).toBe('SAVE10')
    expect(popupOfferCode(null, [])).toBeUndefined()
  })
  it('builds an offer-only popup', () => {
    const popup = offerToPopupBanner(featured)
    expect(popup.bannerType).toBe('popup')
    expect(popup.description).toBe('10% off')
  })
})

import { resolveOfferPopup } from '../storefrontOffers'

describe('resolveOfferPopup', () => {
  const featured = offer({ id: 'f', featured: true, code: 'SAVE10' })
  const banner = { id: 'b', title: 'Sale', bannerType: 'popup', position: 'popup', images: { desktop: '' } } as StorefrontBanner
  it('keeps the tenant banner and attaches the featured code', () => {
    const r = resolveOfferPopup(banner, [featured])
    expect(r.popup).toBe(banner)
    expect(r.offerCode).toBe('SAVE10')
  })
  it('falls back to an offer-only popup', () => {
    const r = resolveOfferPopup(null, [featured])
    expect(r.popup?.id).toBe('offer:f')
    expect(r.offerCode).toBe('SAVE10')
  })
  it('returns nothing when there is neither', () => {
    expect(resolveOfferPopup(null, [])).toEqual({ popup: null, offerCode: undefined })
  })
})
