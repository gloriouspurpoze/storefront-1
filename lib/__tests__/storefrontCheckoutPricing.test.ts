import { describe, expect, it } from 'vitest'
import { storefrontCheckoutTotals } from '../storefrontCheckoutPricing'

const config = (shippingPolicy: Record<string, unknown>) =>
  ({ shippingPolicy }) as unknown as Parameters<typeof storefrontCheckoutTotals>[2]

describe('storefrontCheckoutTotals with discounts', () => {
  it('is unchanged when there is no discount', () => {
    const t = storefrontCheckoutTotals('pickup', 500, null)
    expect(t.discountInr).toBe(0)
    expect(t.totalInr).toBe(500)
  })

  it('takes the discount off the total', () => {
    const t = storefrontCheckoutTotals('pickup', 500, null, { discountInr: 100 })
    expect(t.discountInr).toBe(100)
    expect(t.totalInr).toBe(400)
  })

  it('never discounts below zero', () => {
    const t = storefrontCheckoutTotals('pickup', 50, null, { discountInr: 999 })
    expect(t.discountInr).toBe(50)
    expect(t.totalInr).toBe(0)
  })

  it('ignores negative or junk discounts', () => {
    expect(storefrontCheckoutTotals('pickup', 200, null, { discountInr: -40 }).totalInr).toBe(200)
    expect(
      storefrontCheckoutTotals('pickup', 200, null, { discountInr: Number.NaN }).totalInr,
    ).toBe(200)
  })

  it('waives shipping for free-shipping offers', () => {
    const cfg = config({ deliveryFeeInr: 60 })
    const paid = storefrontCheckoutTotals('delivery', 300, cfg)
    const free = storefrontCheckoutTotals('delivery', 300, cfg, { discountInr: 0, freeShipping: true })
    expect(paid.shippingInr).toBeGreaterThan(0)
    expect(free.shippingInr).toBe(0)
    expect(free.totalInr).toBe(paid.totalInr - paid.shippingInr)
  })

  it('keeps the minimum-order check on the pre-discount subtotal', () => {
    const cfg = config({ minOrderInr: 400 })
    const t = storefrontCheckoutTotals('pickup', 500, cfg, { discountInr: 150 })
    expect(t.minOrderShortfallInr).toBe(0)
  })
})
