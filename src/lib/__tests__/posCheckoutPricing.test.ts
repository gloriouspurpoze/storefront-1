import {
  applyCityMultiplierToUnitPrice,
  computePlatformFeesFromTerms,
  computePosCheckoutTotals,
  resolveCityPriceMultiplier,
} from '../posCheckoutPricing'
import {
  buildRateCardPriceIndex,
  parseRateCardPriceRupee,
  resolvePosCatalogUnitPrice,
} from '../posRateCardPrices'

describe('posRateCardPrices', () => {
  it('parses rupee strings from rate-card copy', () => {
    expect(parseRateCardPriceRupee('From ₹499')).toBe(499)
    expect(parseRateCardPriceRupee('₹299 – ₹499')).toBe(299)
    expect(parseRateCardPriceRupee('Quote on inspection')).toBeNull()
  })

  it('prefers rate-card price over catalog base', () => {
    const index = buildRateCardPriceIndex(
      { electrician: [{ name: 'Fan repair', price: '₹349' }] },
      'electrician',
    )
    const resolved = resolvePosCatalogUnitPrice(
      {
        id: '1',
        name: 'Fan repair',
        base_price: 299,
        service_type: 'fixed',
      },
      index,
    )
    expect(resolved.unitPrice).toBe(349)
    expect(resolved.priceSource).toBe('rate-card')
  })
})

describe('posCheckoutPricing', () => {
  const terms = {
    id: 't1',
    tenantId: 'x',
    currency: 'INR',
    convenienceFeePercent: 2,
    convenienceFeeFixed: 0,
    trainingFeePerProfessional: 0,
    providerCommissionPercent: 15,
    paymentProcessingFeePercent: 2,
    minimumPlatformFeePerBooking: 19,
    gstPercentOnFees: 18,
    afterHoursSurchargePercent: 10,
    visitingFeeFixed: 49,
    freeVisitThresholdRupees: 500,
  }

  it('waives visit fee above threshold and applies convenience floor', () => {
    const fees = computePlatformFeesFromTerms(999, terms)
    expect(fees.visitWaived).toBe(true)
    expect(fees.visitingFee).toBe(0)
    expect(fees.convenienceFee).toBeGreaterThanOrEqual(19)
    expect(fees.convenienceFeeGst).toBeGreaterThan(0)
  })

  it('charges visit fee on small carts', () => {
    const fees = computePlatformFeesFromTerms(299, terms)
    expect(fees.visitingFee).toBe(49)
  })

  it('computes grand total with merchandise GST and fees', () => {
    const result = computePosCheckoutTotals({
      lines: [{ quantity: 1, unitPrice: 400, gstPercent: 18, taxIncluded: false }],
      manualDiscount: 0,
      couponDiscount: 0,
      applyMerchandiseGst: true,
      terms,
      afterHours: false,
    })
    expect(result.lineSubtotal).toBe(400)
    expect(result.merchandiseGstAmount).toBe(72)
    expect(result.visitingFee).toBe(49)
    expect(result.grandTotal).toBeGreaterThan(400 + 72 + 49)
  })

  it('matches city multiplier to operating city name', () => {
    const { multiplier, matchedCity } = resolveCityPriceMultiplier('Mumbai', [
      {
        id: '1',
        name: 'Mumbai',
        slug: 'mumbai',
        isActive: true,
        sortOrder: 0,
        priceMultiplier: 1.15,
      },
    ])
    expect(matchedCity?.name).toBe('Mumbai')
    expect(multiplier).toBe(1.15)
    expect(applyCityMultiplierToUnitPrice(100, multiplier)).toBe(115)
  })

  it('returns multiplier 1 when city name does not match any zone', () => {
    const { multiplier, matchedCity } = resolveCityPriceMultiplier('Unknownville', [
      {
        id: '1',
        name: 'Mumbai',
        slug: 'mumbai',
        isActive: true,
        sortOrder: 0,
        priceMultiplier: 1.15,
      },
    ])
    expect(matchedCity).toBeNull()
    expect(multiplier).toBe(1)
  })
})
