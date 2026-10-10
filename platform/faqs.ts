/**
 * FAQs on torqstudio.com come from the CMS (admin → CMS → FAQs, Torq Studio workspace).
 * Each page reads the FAQs whose **Category** names that page:
 *
 *   Home page        → "Home"
 *   Pricing page     → "Pricing"
 *   Industry pages   → the industry's name or URL, e.g. "Salon & spa" or "for-salons"
 *
 * Matching ignores case, spaces and punctuation, so "pricing", "Pricing " and
 * "PRICING" all work. A page with no active CMS FAQs keeps its built-in questions,
 * so an empty or half-set-up CMS never leaves a page without an FAQ.
 */
import { MARKETING_VERTICALS } from '@profixer/marketing-data'

export type FaqItem = { q: string; a: string }
export type CmsFaqRow = { question?: unknown; answer?: unknown; category?: unknown }
export type FaqPage = 'home' | 'pricing' | `industry:${string}`

/** "Salon & spa" → "salonspa", "for-salons" → "forsalons". */
export function normalizeFaqCategory(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Category names (normalized) that place an FAQ on a page. */
export function faqCategoriesFor(page: FaqPage): string[] {
  if (page === 'home') return ['home', 'homepage']
  if (page === 'pricing') return ['pricing']
  const key = page.slice('industry:'.length)
  const vertical = MARKETING_VERTICALS.find((v) => v.key === key)
  if (!vertical) return []
  return [vertical.marketingSlug, vertical.label, vertical.key, vertical.marketingSlug.replace(/^for-/, '')].map(normalizeFaqCategory)
}

/** Pure selection — exported for tests. Rows arrive sorted by Display Order from the API. */
export function selectFaqs(rows: CmsFaqRow[], page: FaqPage): FaqItem[] {
  const wanted = new Set(faqCategoriesFor(page))
  return rows
    .filter((r) => typeof r.category === 'string' && wanted.has(normalizeFaqCategory(r.category)))
    .map((r) => ({ q: String(r.question ?? '').trim(), a: String(r.answer ?? '').trim() }))
    .filter((r) => r.q && r.a)
}

