import type { TenantCommercialTermsDto, OperatingCityDto } from '../types/operating-commercial.types'

export interface PosCheckoutLine {
  quantity: number
  unitPrice: number
  gstPercent?: number
  taxIncluded?: boolean
}

export interface PosCheckoutPricingInput {
  lines: PosCheckoutLine[]
  manualDiscount: number
  couponDiscount: number
  applyMerchandiseGst: boolean
  terms: TenantCommercialTermsDto | null
  afterHours?: boolean
}

export interface PosCheckoutPricingResult {
  lineSubtotal: number
  afterManual: number
  afterCoupon: number
  merchandiseGstAmount: number
  effectiveGstPercent: number
  visitingFee: number
  visitWaived: boolean
  convenienceFee: number
  convenienceFeeGst: number
  afterHoursSurcharge: number
  grandTotal: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Match backend / CustomerPreviewCard fee formulas on operations-commercial-terms. */
export function computePlatformFeesFromTerms(
  merchandiseAfterDiscounts: number,
  terms: TenantCommercialTermsDto | null,
  options?: { afterHours?: boolean },
): {
  visitingFee: number
  visitWaived: boolean
  convenienceFee: number
  convenienceFeeGst: number
  afterHoursSurcharge: number
} {
  if (!terms) {
    return {
      visitingFee: 0,
      visitWaived: false,
      convenienceFee: 0,
      convenienceFeeGst: 0,
      afterHoursSurcharge: 0,
    }
  }

  const base = Math.max(0, Number(merchandiseAfterDiscounts) || 0)
  const visitFixed = Number(terms.visitingFeeFixed) || 0
  const freeThreshold = Number(terms.freeVisitThresholdRupees) || 0
  const visitFeeApplies = visitFixed > 0
  const visitWaived = visitFeeApplies && freeThreshold > 0 && base >= freeThreshold
  const visitingFee = visitFeeApplies && !visitWaived ? round2(visitFixed) : 0

  const pct = Number(terms.convenienceFeePercent) || 0
  const fixed = Number(terms.convenienceFeeFixed) || 0
  const minFee = Number(terms.minimumPlatformFeePerBooking) || 0
  const gstPct = Number(terms.gstPercentOnFees) || 0

  let convenienceFee = base * (pct / 100) + fixed
  convenienceFee = round2(convenienceFee)
  if (convenienceFee < minFee) convenienceFee = round2(minFee)

  const convenienceFeeGst =
    gstPct > 0 ? round2(convenienceFee * (gstPct / 100)) : 0

  const afterHoursPct = Number(terms.afterHoursSurchargePercent) || 0
  const afterHoursSurcharge =
    options?.afterHours && afterHoursPct > 0
      ? round2(base * (afterHoursPct / 100))
      : 0

  return {
    visitingFee,
    visitWaived,
    convenienceFee,
    convenienceFeeGst,
    afterHoursSurcharge,
  }
}

/** Weighted GST % for posPricing payload (merchandise lines only). */
export function computeMerchandiseGst(
  lines: PosCheckoutLine[],
  taxableSubtotal: number,
  applyMerchandiseGst: boolean,
): { merchandiseGstAmount: number; effectiveGstPercent: number } {
  if (!applyMerchandiseGst || taxableSubtotal <= 0 || lines.length === 0) {
    return { merchandiseGstAmount: 0, effectiveGstPercent: 0 }
  }

  let taxableBase = 0
  let weightedGst = 0

  for (const line of lines) {
    if (line.taxIncluded) continue
    const lineTotal = Math.max(0, line.unitPrice * line.quantity)
    if (lineTotal <= 0) continue
    const pct = Number(line.gstPercent ?? 18) || 0
    taxableBase += lineTotal
    weightedGst += lineTotal * pct
  }

  if (taxableBase <= 0) {
    return { merchandiseGstAmount: 0, effectiveGstPercent: 0 }
  }

  const ratio = Math.min(1, Math.max(0, taxableSubtotal / lineSubtotalFrom(lines)))
  const adjustedBase = round2(taxableBase * ratio)
  const effectiveGstPercent = round2(weightedGst / taxableBase)
  const merchandiseGstAmount = round2(adjustedBase * (effectiveGstPercent / 100))

  return { merchandiseGstAmount, effectiveGstPercent }
}

function lineSubtotalFrom(lines: PosCheckoutLine[]): number {
  return round2(lines.reduce((sum, l) => sum + Math.max(0, l.unitPrice * l.quantity), 0))
}

/** Full POS ticket math aligned with consumer checkout + posPricing verification. */
export function computePosCheckoutTotals(input: PosCheckoutPricingInput): PosCheckoutPricingResult {
  const lineSubtotal = lineSubtotalFrom(input.lines)
  const afterManual = Math.max(0, round2(lineSubtotal - Math.max(0, input.manualDiscount)))
  const afterCoupon = Math.max(0, round2(afterManual - Math.max(0, input.couponDiscount)))

  const { merchandiseGstAmount, effectiveGstPercent } = computeMerchandiseGst(
    input.lines,
    afterCoupon,
    input.applyMerchandiseGst,
  )

  const fees = computePlatformFeesFromTerms(afterCoupon, input.terms, {
    afterHours: input.afterHours,
  })

  const grandTotal = round2(
    afterCoupon +
      merchandiseGstAmount +
      fees.visitingFee +
      fees.convenienceFee +
      fees.convenienceFeeGst +
      fees.afterHoursSurcharge,
  )

  return {
    lineSubtotal,
    afterManual,
    afterCoupon,
    merchandiseGstAmount,
    effectiveGstPercent,
    ...fees,
    grandTotal,
  }
}

/** Resolve operating-city price multiplier from a free-text city field. */
export function resolveCityPriceMultiplier(
  cityName: string,
  cities: OperatingCityDto[],
): { multiplier: number; matchedCity: OperatingCityDto | null } {
  const q = cityName.trim().toLowerCase()
  if (!q || cities.length === 0) return { multiplier: 1, matchedCity: null }

  const exact = cities.find(
    (c) => c?.name && c.name.trim().toLowerCase() === q,
  )
  if (exact && exact.isActive !== false) {
    return { multiplier: Number(exact.priceMultiplier) || 1, matchedCity: exact }
  }

  const partial = cities.find(
    (c) => {
      if (!c?.name || c.isActive === false) return false
      const name = c.name.trim().toLowerCase()
      return q.includes(name) || name.includes(q)
    },
  )
  if (partial) {
    return { multiplier: Number(partial.priceMultiplier) || 1, matchedCity: partial }
  }

  return { multiplier: 1, matchedCity: null }
}

/** Re-apply city multiplier to catalog base unit prices already stored on lines. */
export function applyCityMultiplierToUnitPrice(baseUnitPrice: number, multiplier: number): number {
  const m = Number(multiplier) || 1
  return round2(Math.max(0, baseUnitPrice) * m)
}
