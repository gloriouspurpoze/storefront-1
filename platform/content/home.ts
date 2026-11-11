/**
 * Homepage copy for torqstudio.com (ported from the admin's AdminLandingPage).
 *
 * Trust claims must stay verifiable against the product — no invented customer
 * counts, ratings, testimonials or certifications. Add those only once they are real.
 */
import { PLATFORM_BRAND } from '../config'

export const HOME_TITLE = `${PLATFORM_BRAND} — Bookings, CRM, storefront & billing in one app`
/** Long form — Organization schema and llms.txt. Meta tags use HOME_META_DESCRIPTION (fits the ~160-char snippet). */
export const HOME_DESCRIPTION = `${PLATFORM_BRAND} is an all-in-one business platform for service, restaurant and retail businesses: bookings and orders, built-in CRM, a branded storefront, GST-ready invoicing and team roles. 14-day free trial, INR pricing.`

export const HOME_META_DESCRIPTION =
  'All-in-one platform for service, restaurant and retail businesses: bookings, CRM, a branded storefront and GST invoicing. 14-day free trial, INR pricing.'

/** Answers buyers (and AI assistants) look for; rendered as visible FAQ + FAQPage structured data. */
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: `What is ${PLATFORM_BRAND}?`,
    a: `${PLATFORM_BRAND} is an all-in-one platform for small and growing businesses. It combines bookings and orders, a CRM, a branded online storefront, GST-ready invoicing, team roles and reports in one workspace, set up for your industry.`,
  },
  {
    q: `Who is ${PLATFORM_BRAND} for?`,
    a: 'Home services, restaurants, salons and spas, retail and D2C brands, fitness studios, real estate, B2B services, clinics and education businesses that have outgrown spreadsheets, WhatsApp and disconnected apps.',
  },
  {
    q: `How much does ${PLATFORM_BRAND} cost?`,
    a: 'Plans are priced monthly in Indian rupees (INR), and every plan starts with a 14-day free trial. See the pricing page for current plans for your industry.',
  },
  {
    q: 'Do I need a credit card to start the free trial?',
    a: 'No. You can create a workspace and use every feature for 14 days without a credit card.',
  },
  {
    q: 'Can customers book and pay on my own website?',
    a: `Yes. Every workspace includes a branded storefront that customers can book and buy from, and you can connect your own domain. ${PLATFORM_BRAND} charges a subscription, not a commission on your bookings.`,
  },
  {
    q: 'Are invoices GST-ready?',
    a: 'Yes. Invoices, payments and receivables are recorded in one place in a GST-ready format your accountant can use.',
  },
]

