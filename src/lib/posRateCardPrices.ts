import { cmsMarketingBaseKeysForCatalogSlug } from './categoryMarketingCatalogKeys'
import type { PlatformService } from '../services/api/platformServices.service'

/** Whether a catalog service belongs to the selected industry slug (CMS-aligned aliases). */
export function serviceMatchesIndustryFilter(
  service: Pick<PlatformService, 'category' | 'category_id'>,
  industrySlug: string,
): boolean {
  const cat = String(service.category || service.category_id || '').trim().toLowerCase()
  if (!cat) return false
  const keys = cmsMarketingBaseKeysForCatalogSlug(industrySlug).map((k) => k.toLowerCase())
  return keys.some((k) => cat === k || cat.includes(k) || k.includes(cat))
}

export type RateCardPartRow = { name: string; price: string }

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Extract the first rupee amount from CMS rate-card copy (e.g. "From ₹499", "₹299–₹499"). */
export function parseRateCardPriceRupee(price: string): number | null {
  const cleaned = price.replace(/,/g, '').replace(/[^\d.]/g, ' ')
  const m = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Build name → rupee lookup from rate-card JSON for an industry slug. */
export function buildRateCardPriceIndex(
  rateCards: Record<string, RateCardPartRow[] | unknown> | null | undefined,
  industrySlug: string | null | undefined,
): Map<string, number> {
  const index = new Map<string, number>()
  if (!rateCards || typeof rateCards !== 'object') return index

  const keys =
    industrySlug && industrySlug !== '__all'
      ? cmsMarketingBaseKeysForCatalogSlug(industrySlug)
      : Object.keys(rateCards)

  const seen = new Set<string>()
  for (const key of keys) {
    const normKey = key.trim().toLowerCase()
    if (seen.has(normKey)) continue
    seen.add(normKey)
    const rows = rateCards[key]
    if (!Array.isArray(rows)) continue
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue
      const name = String((row as RateCardPartRow).name ?? '').trim()
      const price = String((row as RateCardPartRow).price ?? '').trim()
      if (!name) continue
      const rupee = parseRateCardPriceRupee(price)
      if (rupee == null) continue
      index.set(normalizeNameKey(name), rupee)
    }
  }
  return index
}

export function catalogServiceBasePrice(
  service: Pick<PlatformService, 'service_type' | 'hourly_rate' | 'consultation_fee' | 'base_price'>,
): number {
  if (service.service_type === 'hourly' && service.hourly_rate != null) return Number(service.hourly_rate)
  if (service.service_type === 'consultation' && service.consultation_fee != null) {
    return Number(service.consultation_fee)
  }
  if (service.base_price != null) return Number(service.base_price)
  return 0
}

/** Rate-card row wins over catalog when names match (same rule as CMS pricing autofill). */
export function resolvePosCatalogUnitPrice(
  service: Pick<PlatformService, 'name' | 'service_type' | 'base_price' | 'hourly_rate' | 'consultation_fee'>,
  rateCardIndex: Map<string, number>,
): { unitPrice: number; priceSource: 'rate-card' | 'catalog' } {
  const fromCard = rateCardIndex.get(normalizeNameKey(service.name))
  if (fromCard != null && fromCard > 0) {
    return { unitPrice: fromCard, priceSource: 'rate-card' }
  }
  return { unitPrice: catalogServiceBasePrice(service), priceSource: 'catalog' }
}
