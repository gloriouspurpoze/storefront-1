/**
 * Build SEO charge-table rows from Platform Services catalog (industry-level pricing).
 */
import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import type { PlatformService } from '../services/api/platformServices.service'
import { createSection, type ContentSection, type SectionPriceRow } from '../types/seoLandingSections'

export function usesTopLevelPriceTable(kind: SeoLandingEntityKind): boolean {
  return kind === 'cost-guides' || kind === 'landing-pages'
}

export function supportsPlatformPriceGuide(kind: SeoLandingEntityKind): boolean {
  return kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages'
}

/** Read charge rows from top-level field or first inline price_table section. */
export function readPriceTableRows(
  draft: Record<string, unknown>,
  kind: SeoLandingEntityKind,
): SectionPriceRow[] {
  if (usesTopLevelPriceTable(kind)) {
    return Array.isArray(draft.priceTable) ? (draft.priceTable as SectionPriceRow[]) : []
  }
  const sections = Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []
  const sec = sections.find((s) => s.type === 'price_table')
  return sec?.rows ?? []
}

/** Write charge rows to top-level priceTable or upsert a price_table page section. */
export function buildPriceTablePatch(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  rows: SectionPriceRow[],
): Record<string, unknown> {
  if (usesTopLevelPriceTable(kind)) {
    return { priceTable: rows }
  }
  const sections = Array.isArray(draft.sections) ? [...(draft.sections as ContentSection[])] : []
  const idx = sections.findIndex((s) => s.type === 'price_table')
  if (idx >= 0) {
    sections[idx] = { ...sections[idx], rows }
  } else {
    const sec = createSection('price_table')
    sec.heading = kind === 'problems' ? 'What it costs to fix' : 'Typical service charges'
    sec.rows = rows
    sections.push(sec)
  }
  return { sections }
}

function roundRupee(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n)
}

/** Map one platform service → charge table row (skips unpriced / inactive). */
export function platformServiceToPriceRow(service: PlatformService): SectionPriceRow | null {
  if (service.is_active === false || service.status === 'archived') return null

  const item = String(service.name ?? '').trim()
  if (!item) return null

  let priceFrom = 0
  let priceTo = 0

  if (service.service_type === 'hourly' && service.hourly_rate != null && service.hourly_rate > 0) {
    const minH = Math.max(1, service.min_hours ?? 1)
    const maxH = Math.max(minH, service.max_hours ?? minH)
    priceFrom = roundRupee(service.hourly_rate * minH)
    priceTo = roundRupee(service.hourly_rate * maxH)
  } else if (service.service_type === 'consultation' && service.consultation_fee != null && service.consultation_fee > 0) {
    priceFrom = roundRupee(service.consultation_fee)
    priceTo = priceFrom
  } else if (service.base_price != null && service.base_price > 0) {
    priceFrom = roundRupee(service.base_price)
    const mrp =
      service.original_price != null && service.original_price > priceFrom
        ? roundRupee(service.original_price)
        : null
    priceTo = mrp ?? roundRupee(priceFrom * 1.15)
    if (priceTo < priceFrom) priceTo = priceFrom
  } else {
    return null
  }

  const noteParts: string[] = []
  if (service.duration?.trim()) noteParts.push(service.duration.trim())
  if (service.short_description?.trim()) {
    noteParts.push(service.short_description.replace(/\s+/g, ' ').trim().slice(0, 90))
  }
  if (service.tax_included === false) noteParts.push('+ GST')

  return {
    item,
    priceFrom,
    priceTo,
    currency: 'INR',
    note: noteParts.length ? noteParts.join(' · ').slice(0, 140) : undefined,
  }
}

/** Active, priced services for a category — sorted catalog order (industry default). */
export function buildPriceTableFromPlatformServices(services: PlatformService[]): SectionPriceRow[] {
  const sorted = [...services].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
  const rows: SectionPriceRow[] = []
  const seen = new Set<string>()
  for (const s of sorted) {
    const row = platformServiceToPriceRow(s)
    if (!row) continue
    const key = row.item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
  return rows
}

/** Merge catalog rows — existing manual rows kept; catalog fills gaps by item name. */
export function mergePriceTableWithCatalog(
  existing: SectionPriceRow[],
  catalog: SectionPriceRow[],
): SectionPriceRow[] {
  const byItem = new Map<string, SectionPriceRow>()
  for (const r of existing) {
    const k = r.item.trim().toLowerCase()
    if (k) byItem.set(k, r)
  }
  for (const r of catalog) {
    const k = r.item.trim().toLowerCase()
    if (!k || byItem.has(k)) continue
    byItem.set(k, r)
  }
  return [...byItem.values()]
}

export function suggestPriceTableCaption(params: {
  categoryLabel: string
  locationName?: string
  year?: number
  kind: 'cost-guides' | 'landing-pages'
}): string {
  const { categoryLabel, locationName, year, kind } = params
  const y = year ?? new Date().getFullYear()
  if (kind === 'cost-guides') {
    return locationName
      ? `Indicative ${categoryLabel.toLowerCase()} charges in ${locationName} (${y})`
      : `${categoryLabel} charges (${y})`
  }
  return locationName
    ? `${categoryLabel} prices in ${locationName} (${y})`
    : `${categoryLabel} service prices (${y})`
}
