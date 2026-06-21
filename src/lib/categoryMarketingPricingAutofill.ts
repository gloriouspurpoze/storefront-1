/**
 * Build category-marketing pricing table rows from live catalog + rate-card CMS.
 * Rate-card rows override catalog prices when the service name matches.
 */
import type { PlatformService } from '../services/api/platformServices.service'
import type { ComparisonRow, SparePartRow } from '../types/categoryMarketing'
import {
  resolveMarketingVerticalKey,
  VERTICAL_MARKETING_PROFILES,
} from './categoryMarketingVerticalPrefill'

export type RateCardPartRow = { name: string; price: string }

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function formatPlatformServicePrice(service: PlatformService): string {
  if (service.service_type === 'hourly' && service.hourly_rate != null) {
    return `From ${inr.format(service.hourly_rate)}/hr`
  }
  if (service.service_type === 'consultation' && service.consultation_fee != null) {
    return `From ${inr.format(service.consultation_fee)}`
  }
  if (service.base_price != null && Number.isFinite(service.base_price)) {
    const base = inr.format(service.base_price)
    if (
      service.original_price != null &&
      service.original_price > service.base_price
    ) {
      return `${base} (MRP ${inr.format(service.original_price)})`
    }
    return `From ${base}`
  }
  return 'Quote on inspection'
}

function sortServicesForPricing(services: PlatformService[]): PlatformService[] {
  return [...services]
    .filter((s) => s.is_active && s.status !== 'archived')
    .sort((a, b) => {
      const pop = Number(b.is_popular) - Number(a.is_popular)
      if (pop !== 0) return pop
      const feat = Number(b.is_featured) - Number(a.is_featured)
      if (feat !== 0) return feat
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
    })
}

/** Merge catalog services + rate-card lines into spareParts rows for the pricing matrix. */
export function buildPricingTableFromSources(opts: {
  rateCardParts: RateCardPartRow[]
  platformServices: PlatformService[]
  maxRows?: number
}): SparePartRow[] {
  const max = opts.maxRows ?? 32
  const byKey = new Map<string, SparePartRow>()

  for (const service of sortServicesForPricing(opts.platformServices)) {
    const name = service.name.trim()
    if (!name) continue
    byKey.set(normalizeNameKey(name), {
      name,
      priceRange: formatPlatformServicePrice(service),
    })
  }

  for (const part of opts.rateCardParts) {
    const name = part.name.trim()
    if (!name) continue
    byKey.set(normalizeNameKey(name), {
      name,
      priceRange: part.price.trim() || 'Quote on inspection',
    })
  }

  return Array.from(byKey.values()).slice(0, max)
}

export function getIndustryComparisonRows(industrySlug: string): ComparisonRow[] {
  const key = resolveMarketingVerticalKey(industrySlug)
  const profile = VERTICAL_MARKETING_PROFILES[key] ?? VERTICAL_MARKETING_PROFILES.default
  return profile.comparisonRows.map((r) => ({
    label: r.label,
    profixer: r.profixer,
    others: r.others,
  }))
}

export function getIndustryPricingLists(industrySlug: string): {
  pricingIncluded: string[]
  pricingExcluded: string[]
} {
  const key = resolveMarketingVerticalKey(industrySlug)
  const profile = VERTICAL_MARKETING_PROFILES[key] ?? VERTICAL_MARKETING_PROFILES.default
  return {
    pricingIncluded: [...profile.pricingIncluded],
    pricingExcluded: [...profile.pricingExcluded],
  }
}

export type PricingSourceSummary = {
  catalogCount: number
  rateCardCount: number
  mergedCount: number
  primarySource: 'rate-card' | 'catalog' | 'mixed' | 'none'
}

export function summarizePricingSources(opts: {
  rateCardParts: RateCardPartRow[]
  platformServices: PlatformService[]
  merged: SparePartRow[]
}): PricingSourceSummary {
  const catalogCount = sortServicesForPricing(opts.platformServices).length
  const rateCardCount = opts.rateCardParts.filter((p) => p.name.trim()).length
  const mergedCount = opts.merged.length
  let primarySource: PricingSourceSummary['primarySource'] = 'none'
  if (mergedCount === 0) primarySource = 'none'
  else if (catalogCount > 0 && rateCardCount > 0) primarySource = 'mixed'
  else if (rateCardCount > 0) primarySource = 'rate-card'
  else primarySource = 'catalog'
  return { catalogCount, rateCardCount, mergedCount, primarySource }
}
