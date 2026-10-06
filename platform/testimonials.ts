/**
 * Testimonials on torqerp.com come from the CMS (admin → CMS → Testimonials, torqERP
 * workspace). Only **Active + Featured** testimonials are published by the API.
 *
 * The admin **Service** field targets a page, like FAQ categories (see `faqs.ts`):
 *   blank or "Home"            → home page (and any industry page without its own)
 *   an industry name or URL    → that industry page, e.g. "Salon & spa" / "for-salons"
 *
 * There is no built-in fallback: with no real testimonials the section is simply hidden.
 */
import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import { faqCategoriesFor, normalizeFaqCategory, type FaqPage } from './faqs'

export const MAX_TESTIMONIALS = 3

function isGeneral(t: StorefrontCmsTestimonial): boolean {
  const s = normalizeFaqCategory(t.serviceType ?? '')
  return s === '' || faqCategoriesFor('home').includes(s)
}

/** Pure selection — exported for tests. Input is already in the CMS Display Order. */
export function selectTestimonials(rows: StorefrontCmsTestimonial[], page: FaqPage): StorefrontCmsTestimonial[] {
  if (page === 'home') {
    const general = rows.filter(isGeneral)
    return (general.length ? general : rows).slice(0, MAX_TESTIMONIALS)
  }
  const wanted = new Set(faqCategoriesFor(page))
  const targeted = rows.filter((t) => wanted.has(normalizeFaqCategory(t.serviceType ?? '')))
  return (targeted.length ? targeted : rows.filter(isGeneral)).slice(0, MAX_TESTIMONIALS)
}
