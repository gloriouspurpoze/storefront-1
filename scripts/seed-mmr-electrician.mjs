/**
 * Seed the recommended **MMR electrician cluster** into Category Marketing CMS.
 *
 * Structure (matches the agreed strategy):
 *   electrician                      → base / industry page (full content)
 *   electrician__mira-bhayandar      → ONE page covering Mira Road + Bhayandar E/W
 *                                      (Mira Road is folded in as a served area, NOT its own URL)
 *   electrician__dahisar             → distinct demand + area = its own page
 *
 * It also upserts the two localities in Service Catalog Localities with
 * neighborhoods / societies / SEO quality signals so the user-site sitemap gate
 * (`localityRegistry.ts`, floor 0.7) has the data it needs.
 *
 * The locality keys are PARTIAL overlays — the consumer site merges them on top
 * of the `electrician` base, so we only set fields that are genuinely local.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 *   # 1) Dry run (default) — writes JSON previews to scripts/out/, no network write:
 *   node scripts/seed-mmr-electrician.mjs
 *
 *   # 2) Commit to the backend (requires a dashboard JWT with CMS permissions):
 *   SEED_ADMIN_TOKEN="<jwt>" node scripts/seed-mmr-electrician.mjs --commit
 *
 * ENV
 *   SEED_API_URL      API base incl. /api   (default: REACT_APP_API_URL or http://localhost:8005/api)
 *   SEED_ADMIN_TOKEN  Dashboard JWT         (required only with --commit)
 *   SEED_TENANT_ID    Tenant id             (optional; sent as the tenant header in SaaS mode)
 *   SEED_TENANT_HEADER Tenant header name   (default: X-Tenant-Id)
 *   PUBLIC_ORIGIN     Consumer site origin  (default: https://www.profixer.in)
 *
 * SAFETY
 *   - Dry run by default. Network writes happen ONLY with --commit.
 *   - On commit it GETs the existing blob first and MERGES (never clobbers other keys).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'out')

const COMMIT = process.argv.includes('--commit')
const API_BASE = (process.env.SEED_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8005/api').replace(/\/$/, '')
const TOKEN = process.env.SEED_ADMIN_TOKEN || process.env.ADMIN_TOKEN || ''
const TENANT_ID = process.env.SEED_TENANT_ID || ''
const TENANT_HEADER = process.env.SEED_TENANT_HEADER || 'X-Tenant-Id'
const ORIGIN = (process.env.PUBLIC_ORIGIN || 'https://www.profixer.in').replace(/\/$/, '')

const CM_PATH = '/cms/admin/static-content/category-marketing'
const LOC_PATH = '/cms/admin/service-catalog-localities'

/* ───────────────────────────── content helpers ───────────────────────────── */

const sp = (name, priceRange) => ({ name, priceRange })
const card = (title, description, price, duration, warranty, bookUrl) => ({
  title, description, price, rating: '', duration, warranty, bookUrl,
})
const faq = (question, answer) => ({ question, answer })
const link = (label, url) => ({ label, url })

const BOOK = `${ORIGIN}/book?service=electrician`
const CAT_URL = `${ORIGIN}/services/electrician`

/* ───────────────────────────── 1) BASE: electrician ──────────────────────────── */

const electricianBase = {
  seoTitle: 'Electrician Services | Verified, Inspection-First | Profixer',
  metaDescription:
    'Book verified electricians for MCB trips, DB faults, wiring, fans, lights & AC points. Inspection-first quotes, tidy work, digital invoices. Schedule online on Profixer.',
  urlSlugPattern: '/services/electrician',
  primaryKeyword: 'electrician services',
  secondaryKeywords: [
    'electrician near me', 'MCB repair', 'DB upgrade', 'home wiring', 'fan installation',
    'switch and socket repair', 'AC point wiring', 'emergency electrician', 'earthing check',
  ],
  heroTrustBadge: 'Verified electricians · Inspection-first quotes',
  heroChip: 'Same-day slots subject to availability',
  heroProofPoints: [
    'Inspection-first pricing before parts',
    'Neat routing & dust control',
    'Digital invoice + workmanship warranty',
    'Background-verified partners',
  ],
  topicChips: ['MCB tripping', 'Partial power loss', 'DB upgrade', 'Lights & fans', 'AC point', 'Earthing check'],
  mainHeading: 'Electrician services',
  intro:
    '<p>From a tripping MCB to a planned distribution-board upgrade, Profixer routes background-verified electricians who inspect first, explain what is unsafe, then fix with clear scope. You get transparent spare billing and a digital invoice on every visit.</p>',
  introLeadMagnetLabel: 'Download: home electrical safety checklist',
  introLeadMagnetUrl: `${CAT_URL}`,
  image1: '',
  image2: '',
  serviceCards: [
    card('MCB tripping & DB fault', '<p>Tripping breaker, burning smell, or one room dead? We trace faults and replace failed accessories with load-safe sizing.</p>', 'From ₹299 visit + parts', '60–120 mins', 'Workmanship warranty as per policy', `${BOOK}&type=mcb`),
    card('Lights, fans & fixtures', '<p>Installations and replacements with alignment, anchors, and safe terminations—ideal after interior upgrades.</p>', 'From ₹199 per point (indicative)', '45–90 mins', 'Workmanship warranty as per policy', `${BOOK}&type=lights`),
    card('AC point & heavy load', '<p>16A line checks before new AC installs; we validate DB capacity and society norms before routing.</p>', 'Quote after inspection', '90–180 mins', 'Workmanship warranty as per policy', `${BOOK}&type=ac-point`),
  ],
  serviceTypes: [
    { title: 'DB & MCB', description: '<p>Distribution boards age with humidity and load creep. We map circuits, label breakers, and recommend upgrades only when needed.</p>', bullets: ['Trip trace & accessory replacement', 'Loose neutral / terminal heat checks', 'DB balancing for new AC', 'Documentation photos on request'] },
    { title: 'Lighting & routing', description: '<p>False-ceiling LED profiles, dimmers, and gallery lighting—planned cuts and dust control where possible.</p>', bullets: ['LED / profile installs', 'Smart switch compatibility checks', 'Chandelier support as per ceiling', 'Minimal rework policy'] },
  ],
  trustBenefits: [
    { heading: 'Verified & insured partners', body: '<p>Background-verified electricians; carry ID; follow society gate rules and quiet hours where applicable.</p>' },
    { heading: 'Transparent estimates', body: '<p>Scope card before cutting chases; spares billed with MRP reference where available.</p>' },
    { heading: 'Warranty you can use', body: '<p>Workmanship warranty as per policy; repeat visit for covered defects without runaround.</p>' },
  ],
  waysHeading: 'How booking an electrician works',
  waysBullets: ['Pick service & slot online', 'Partner arrives with standard tools & spares', 'Inspection + estimate before major work', 'Tidy closure + heat test on DB work', 'Digital invoice & warranty note'],
  experienceIncluded: ['Site photos on request', 'Standard spares on vehicle', 'Cable dressing in visible areas', 'Society pass assistance guidance'],
  areasList: ['Mira Bhayandar', 'Dahisar', 'Borivali', 'Kandivali'],
  areasCta: 'Check slot availability in your area',
  areasCopy: '<p>We route technicians from hubs across the Mumbai Metropolitan Region to reduce dead time during peak traffic. ETAs update live after dispatch.</p>',
  bookingSteps: [
    { stepNumber: '1', title: 'Book online', description: '<p>Choose electrician, add address & photos of the DB if tripping.</p>' },
    { stepNumber: '2', title: 'Confirmation', description: '<p>Slot + partner details; reschedule rules as per policy.</p>' },
    { stepNumber: '3', title: 'Visit & diagnosis', description: '<p>Inspection-first; approval before material-heavy work.</p>' },
    { stepNumber: '4', title: 'Pay & support', description: '<p>Digital invoice; warranty channel on app/WhatsApp.</p>' },
  ],
  contactPhone: '',
  contactWhatsapp: '',
  spareParts: [
    sp('Single-pole MCB (common brands)', '₹180–₹450 + labour'),
    sp('RCBO / RCCB (where applicable)', 'Quote after DB audit'),
    sp('6–10 sq.mm copper wire (per metre)', 'MRP + labour'),
  ],
  pricingIncluded: ['Standard multimeter checks', 'Basic terminal tightening in scope', 'Site cleanup for drill dust (minor)', 'Digital invoice'],
  pricingExcluded: ['Civil chasing / putty (if outsourced)', 'OEM proprietary smart modules', 'Hidden slab conduit mega-rewires without approval', 'After-hours premium if applicable'],
  comparisonRows: [
    { label: 'Estimates', profixer: 'Inspection-first scope card', others: 'Often quote on phone without DB open' },
    { label: 'Spares', profixer: 'Itemised where possible', others: 'Generic “package” unclear' },
    { label: 'Warranty', profixer: 'Policy-backed workmanship note', others: 'Varies; ask every time' },
    { label: 'Society rules', profixer: 'Quiet hours & pass guidance', others: 'Inconsistent communication' },
  ],
  faqs: [
    faq('Why does my MCB trip when the AC starts?', 'Often an underrated MCB, a loose terminal, or weak earthing. We measure load and terminations before suggesting a change.'),
    faq('Do you upgrade a full DB?', 'Yes, with a planned changeover window; price after audit.'),
    faq('How does pricing work?', 'Most visits start with an inspection or scope check, then a clear estimate before material-heavy work. You get a digital invoice; warranty follows the published policy.'),
    faq('What if the fault returns after a visit?', 'Covered defects per policy get a priority revisit with prior invoice reference.'),
  ],
  relatedLinks: [
    link('All services', `${ORIGIN}/services`),
    link('Book online', `${ORIGIN}/book`),
    link('Plumber services', `${ORIGIN}/services/plumber`),
  ],
  closingParagraph:
    '<p>Whether it is a warm DB, a dead bedroom circuit, or a planned lighting upgrade, book an electrician who prioritises safety and tidy execution. If you are unsure, start with a DB health check before monsoon peak.</p>',
  leadMagnet: {
    headline: 'Free PDF: apartment electrical safety (MMR edition)',
    description: 'Room-by-room checks you can do tonight + when to call a pro.',
    ctaLabel: 'Send me the PDF',
  },
  jsonLdExtra:
    'Consumer should emit Service + FAQPage (+ BreadcrumbList) from CMS fields. Leave aggregateRating empty unless the same numbers are visible on this URL.',
  localityGuide: { enabled: false },
  localSeo: {
    enableLocalBusinessSchema: false,
    localProfileName: 'Profixer — Electricians',
    serviceAreaHeadline: 'Areas we serve across [City]',
    serviceAreaPlaceNames: ['Mira Bhayandar', 'Dahisar', 'Borivali', 'Kandivali', 'Mumbai'],
    localIntentKeywords: ['electrician near me', 'emergency electrician', 'MCB repair', 'DB upgrade'],
    priceRange: '₹₹',
    addressRegion: 'Maharashtra',
    addressCountryCode: 'IN',
  },
  technicalSeo: {
    canonicalUrl: `${CAT_URL}`,
    ogTitle: 'Electrician Services | Profixer',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robotsMeta: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    knowsAbout: ['Electrical wiring', 'Distribution board', 'Residual current device', 'Home electrical safety'],
    schemaPrimaryType: 'HomeAndConstructionBusiness',
    enableBreadcrumbSchema: true,
    breadcrumbItems: [
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Services', url: `${ORIGIN}/services` },
      { name: 'Electrician', url: `${CAT_URL}` },
    ],
    answerEngineSummary:
      'Profixer electricians fix MCB trips, DB faults, wiring, and lighting installs with inspection-first pricing and policy-backed workmanship warranty.',
    aggregateRating: { ratingValue: '', reviewCount: '' },
    enableWebPageSchema: true,
    enableServiceOfferSchema: true,
  },
}

/* ── 2) OVERLAY: electrician__mira-bhayandar (folds in Mira Road + Bhayandar E/W) ── */

const MB_URL = `${CAT_URL}/mira-bhayandar`
const electricianMiraBhayandar = {
  seoTitle: 'Electrician in Mira Bhayandar | DB, Wiring & Safe Installs',
  metaDescription:
    'Book verified electricians in Mira Bhayandar (incl. Mira Road & Bhayandar East/West) for MCB trips, DB checks, lighting & AC points—clear estimates, tidy work. Book on Profixer.',
  urlSlugPattern: '/services/electrician/mira-bhayandar',
  primaryKeyword: 'electrician in Mira Bhayandar',
  secondaryKeywords: [
    'electrician Mira Road', 'electrician Bhayandar East', 'electrician Bhayandar West',
    'MCB repair Mira Bhayandar', 'DB upgrade Bhayandar', 'fan installation Mira Road',
    'AC point wiring Mira Bhayandar', 'emergency electrician Mira Bhayandar',
  ],
  mainHeading: 'Electrician services in Mira Bhayandar',
  heroChip: 'Mira Road · Bhayandar East/West',
  intro:
    '<p>Homes across Mira Bhayandar—from older chawls near Bhayandar station to mid-rise wings on Mira Road—often run higher AC load on ageing DBs, so warm breakers and neutral issues show up fast. We inspect first, explain what is unsafe, then fix with clear scope and tidy routing.</p>',
  faqs: [
    faq('Do you cover both Mira Road and Bhayandar East/West?', 'Yes. Mira Road, Bhayandar East, Bhayandar West, Naya Nagar and Golden Nest are all served from the same Mira Bhayandar hub—book the same page for any of these areas.'),
    faq('Can you handle society quiet-hours and gate rules near Bhayandar?', 'Yes—many societies restrict drilling after 6 pm or on Sundays. We align slots, carry ID, and coordinate meter-room access with your secretary.'),
    faq('My MCB trips when the AC starts in my Mira Road flat—what is the cause?', 'Usually an underrated MCB, a loose terminal, or weak earthing under coastal humidity. We measure load and terminations before suggesting any change.'),
  ],
  closingParagraph:
    '<p>Whether you are in a Mira Road tower or a Bhayandar chawl, book an electrician who prioritises safety paperwork and tidy execution. Start with a DB health check before monsoon peak.</p>',
  localityGuide: {
    enabled: true,
    expandDetailsByDefault: false,
    articleH2: 'Local guide: hiring an electrician in Mira Bhayandar',
    leadParagraphs: [
      'Mira Bhayandar mixes older chawls, mid-rise wings, and new towers across Mira Road and Bhayandar—each with different DB brands and load patterns. Coastal humidity can accelerate contact pitting in poorly torqued terminals.',
      'This guide explains what we fix most often across the area, how we price, and how to prepare for a smooth visit.',
    ],
    sections: [
      { h2: 'Common faults near Bhayandar & Mira Road', paragraphs: ['Partial power loss after monsoon dampness; kitchen hob trips when kettle and induction run together; geyser lines undersized for 3kW loads.', 'We start with DB mapping and thermal checks before suggesting rewires—so you only pay for necessary work.'] },
      { h2: 'High-rise society rules & quiet hours', paragraphs: ['Many societies restrict drilling after 6 pm or on Sundays. We align slots and use dust mats in lift lobbies.', 'For meter-room access, we coordinate with your secretary and carry ID badges as per your policy.'] },
      { h2: 'When to upgrade vs repair', paragraphs: ['If breakers are hot, neutrals are shared across rooms, or MCBs are obsolete, upgrade paths are explained with photos.', 'If the fault is local (one loose accessory), we repair same day when spares are available.'] },
    ],
    summaryLead: 'Book inspection-first electrical help across Mira Bhayandar with clear estimates and tidy execution.',
    takeaways: ['DB heat is a warning—do not ignore it', 'Photo your DB label before booking', 'Keep your last invoice for warranty', 'Monsoon prep: check outdoor points'],
    jsonLdBrandServiceName: 'Profixer Electrician — Mira Bhayandar',
    useFaqsForSchema: true,
    showInboundLinkStrip: true,
    showBookingCtaStrip: true,
  },
  localSeo: {
    enableLocalBusinessSchema: false,
    localProfileName: 'Profixer — Electricians (Mira Bhayandar)',
    serviceAreaHeadline: 'Areas we serve near [Location] & [City]',
    // Mira Road & Bhayandar folded in here as served areas — NOT separate URLs:
    serviceAreaPlaceNames: ['Mira Road', 'Bhayandar East', 'Bhayandar West', 'Naya Nagar', 'Golden Nest', 'Uttan Road (select pockets)'],
    serviceAreaNarrative:
      'We operate mobile electrician teams across Mira Bhayandar and adjoining Mira Road sectors, prioritising DB safety and lighting installs. Coverage follows traffic-aware routing; some Uttan/Gorai pockets may need extended ETA—confirm at booking.',
    localIntentKeywords: ['electrician near me Mira Bhayandar', 'MCB repair Bhayandar East', 'DB upgrade Mira Road', 'fan installation Mira Bhayandar', 'emergency electrician Bhayandar'],
    openingHoursSummary: 'Daily 8:00 am – 9:00 pm (last slot 8:00 pm); emergencies subject to partner availability',
    addressLocality: 'Mira Bhayandar',
    addressRegion: 'Maharashtra',
    postalCode: '',
    addressCountryCode: 'IN',
    geoLatLng: '',
    priceRange: '₹₹',
  },
  technicalSeo: {
    canonicalUrl: MB_URL,
    ogTitle: 'Electrician in Mira Bhayandar | Profixer',
    ogImageAlt: 'Electrician checking a distribution board in a Mira Bhayandar home',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robotsMeta: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    knowsAbout: ['Electrical wiring', 'Distribution board', 'Residual current device', 'Mumbai Metropolitan Region home safety'],
    schemaPrimaryType: 'HomeAndConstructionBusiness',
    enableBreadcrumbSchema: true,
    breadcrumbItems: [
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Services', url: `${ORIGIN}/services` },
      { name: 'Electrician', url: `${CAT_URL}` },
      { name: 'Mira Bhayandar', url: MB_URL },
    ],
    answerEngineSummary:
      'Profixer electricians in Mira Bhayandar (incl. Mira Road and Bhayandar East/West) fix MCB trips, DB faults, and lighting installs with inspection-first pricing and policy-backed workmanship warranty.',
    aggregateRating: { ratingValue: '', reviewCount: '' },
    enableWebPageSchema: true,
    enableServiceOfferSchema: true,
  },
}

/* ───────────────── 3) OVERLAY: electrician__dahisar ───────────────── */

const DH_URL = `${CAT_URL}/dahisar`
const electricianDahisar = {
  seoTitle: 'Electrician in Dahisar | MCB, DB & Lighting Repairs',
  metaDescription:
    'Book verified electricians in Dahisar (East & West) for MCB trips, DB upgrades, fans, lights & AC points—inspection-first quotes, tidy work, digital invoices. Book on Profixer.',
  urlSlugPattern: '/services/electrician/dahisar',
  primaryKeyword: 'electrician in Dahisar',
  secondaryKeywords: [
    'electrician Dahisar East', 'electrician Dahisar West', 'MCB repair Dahisar',
    'DB upgrade Dahisar', 'fan installation Dahisar', 'AC point electrician Dahisar',
    'emergency electrician Dahisar',
  ],
  mainHeading: 'Electrician services in Dahisar',
  heroChip: 'Dahisar East & West',
  intro:
    '<p>Dahisar homes along SV Road and Link Road mix old stock with newer towers—so loose neutrals, monsoon leakage trips, and undersized geyser lines are common. We diagnose with DB mapping and thermal checks before suggesting any rewire, and keep visible cabling tidy.</p>',
  faqs: [
    faq('Do you cover both Dahisar East and Dahisar West?', 'Yes. Dahisar East, Dahisar West, Ashokvan, Rawalpada and Kandarpada are all served from the same Dahisar hub—book this page for any of these areas.'),
    faq('Why do my lights trip during the monsoon?', 'Leakage trips spike with damp—often a weak earth or moisture in outdoor points. We isolate circuit by circuit with an ELCB/RCCB check before advising a fix.'),
    faq('Can you align with society drilling and noise rules on Link Road?', 'Yes—we book daytime slots where societies restrict noise and carry dust mats for lift lobbies.'),
  ],
  closingParagraph:
    '<p>From a warm DB in a Dahisar West tower to a tripping circuit in an Ashokvan flat, book an electrician who tests after fixes and explains the safe option first.</p>',
  localityGuide: {
    enabled: true,
    expandDetailsByDefault: false,
    articleH2: 'Local guide: electricians in Dahisar for monsoon-ready homes',
    leadParagraphs: [
      'Dahisar mixes old chawls, mid-rise wings, and newer towers along SV Road and Link Road—each with different load patterns and earthing quality. Monsoon humidity pushes leakage trips and outdoor-point faults.',
      'This guide covers what we fix most, how we price, and how to prep your home for a tidy visit.',
    ],
    sections: [
      { h2: 'Monsoon leakage & earthing checks', paragraphs: ['Leakage trips rise during rains—often a weak earth, damp outdoor points, or moisture in junction boxes.', 'We do stepwise isolation with an ELCB/RCCB check before suggesting any change.'] },
      { h2: 'High-rises vs older stock', paragraphs: ['Towers often have labelled DBs and three-phase supply; older stock may have shared neutrals and obsolete MCBs.', 'We map circuits and label breakers so future visits are faster.'] },
      { h2: 'When to upgrade vs repair', paragraphs: ['Hot breakers, shared neutrals, or obsolete MCBs point to an upgrade path, explained with photos.', 'A single loose accessory is a same-day repair when spares are available.'] },
    ],
    summaryLead: 'Book inspection-first electrical help across Dahisar with clear estimates and post-work testing.',
    takeaways: ['Monsoon: check outdoor points & earthing', 'Photo your DB label before booking', 'Hot breaker = book a DB health check', 'Keep your last invoice for warranty'],
    jsonLdBrandServiceName: 'Profixer Electrician — Dahisar',
    useFaqsForSchema: true,
    showInboundLinkStrip: true,
    showBookingCtaStrip: true,
  },
  localSeo: {
    enableLocalBusinessSchema: false,
    localProfileName: 'Profixer — Electricians (Dahisar)',
    serviceAreaHeadline: 'Areas we serve near [Location] & [City]',
    serviceAreaPlaceNames: ['Dahisar East', 'Dahisar West', 'Ashokvan', 'Rawalpada', 'Kandarpada', 'Anand Nagar (Dahisar)'],
    serviceAreaNarrative:
      'We run mobile electrician teams across Dahisar East and West, with routing that avoids Link Road peaks where possible. Coverage extends toward Rawalpada and Ashokvan; confirm ETA for pockets near the national park edge during evening traffic.',
    localIntentKeywords: ['electrician near me Dahisar', 'MCB repair Dahisar East', 'DB upgrade Dahisar West', 'fan installation Dahisar', 'emergency electrician Dahisar'],
    openingHoursSummary: 'Daily 8:00 am – 9:00 pm (last slot 8:00 pm); emergencies subject to partner availability',
    addressLocality: 'Dahisar',
    addressRegion: 'Maharashtra',
    postalCode: '',
    addressCountryCode: 'IN',
    geoLatLng: '',
    priceRange: '₹₹',
  },
  technicalSeo: {
    canonicalUrl: DH_URL,
    ogTitle: 'Electrician in Dahisar | Profixer',
    ogImageAlt: 'Electrician checking a distribution board in a Dahisar apartment',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robotsMeta: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    knowsAbout: ['Electrical wiring', 'Distribution board', 'Earthing', 'Mumbai monsoon home maintenance'],
    schemaPrimaryType: 'HomeAndConstructionBusiness',
    enableBreadcrumbSchema: true,
    breadcrumbItems: [
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Services', url: `${ORIGIN}/services` },
      { name: 'Electrician', url: `${CAT_URL}` },
      { name: 'Dahisar', url: DH_URL },
    ],
    answerEngineSummary:
      'Profixer electricians in Dahisar (East & West) fix MCB trips, monsoon leakage, DB faults, and lighting installs with inspection-first quotes and policy-backed workmanship warranty.',
    aggregateRating: { ratingValue: '', reviewCount: '' },
    enableWebPageSchema: true,
    enableServiceOfferSchema: true,
  },
}

/* ───────────────── locality master records (sitemap-gate data) ───────────────── */

const localities = [
  {
    name: 'Mira Bhayandar',
    slug: 'mira-bhayandar',
    sortOrder: 10,
    isActive: true,
    parentCity: 'Mumbai',
    // Mira Road folded in here so it does NOT become its own indexable URL:
    neighborhoods: ['Mira Road', 'Bhayandar East', 'Bhayandar West', 'Naya Nagar', 'Golden Nest', 'Uttan Road'],
    societies: ['Golden Nest', 'Sheetal Nagar', 'Silver Park'],
    infrastructureFacts: [
      'Coastal humidity accelerates terminal pitting in poorly torqued DBs.',
      'Mix of older chawls near Bhayandar station and mid-rise towers on Mira Road.',
    ],
    isIndexable: true,
    qualitySignals: {
      providerAvailability: true,
      reviewCount: false,
      hasUniqueContent: true,
      faqCoverage: true,
      hasPricingInfo: true,
      searchDemand: true,
      contentQualityScore: 0.75,
    },
  },
  {
    name: 'Dahisar',
    slug: 'dahisar',
    sortOrder: 20,
    isActive: true,
    parentCity: 'Mumbai',
    neighborhoods: ['Dahisar East', 'Dahisar West', 'Ashokvan', 'Rawalpada', 'Kandarpada', 'Anand Nagar'],
    societies: ['Ashokvan', 'Rushi Heights'],
    infrastructureFacts: [
      'SV Road / Link Road corridor mixes old stock with newer towers.',
      'Monsoon humidity drives leakage trips and outdoor-point faults.',
    ],
    isIndexable: true,
    qualitySignals: {
      providerAvailability: true,
      reviewCount: false,
      hasUniqueContent: true,
      faqCoverage: true,
      hasPricingInfo: true,
      searchDemand: true,
      contentQualityScore: 0.72,
    },
  },
]

const categoryMarketingSeed = {
  electrician: electricianBase,
  'electrician__mira-bhayandar': electricianMiraBhayandar,
  'electrician__dahisar': electricianDahisar,
}

/* ───────────────────────────── network helpers ───────────────────────────── */

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`
  if (TENANT_ID) h[TENANT_HEADER] = TENANT_ID
  return h
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers() })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`)
  const body = await res.json().catch(() => ({}))
  return body?.data ?? body ?? {}
}

async function putJson(path, data) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) })
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status} ${res.statusText} :: ${await res.text().catch(() => '')}`)
  return res.json().catch(() => ({}))
}

async function postJson(path, data) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(data) })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${res.statusText} :: ${await res.text().catch(() => '')}`)
  return res.json().catch(() => ({}))
}

function writePreview(name, obj) {
  mkdirSync(OUT_DIR, { recursive: true })
  const file = join(OUT_DIR, name)
  writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8')
  return file
}

/* ───────────────────────────────── main ───────────────────────────────── */

async function main() {
  const keys = Object.keys(categoryMarketingSeed)
  console.log('\nProfixer — seed MMR electrician cluster')
  console.log('API base   :', API_BASE)
  console.log('Public site:', ORIGIN)
  console.log('Mode       :', COMMIT ? 'COMMIT (will write to backend)' : 'DRY RUN (no network writes)')
  console.log('CM keys    :', keys.join(', '))
  console.log('Localities :', localities.map((l) => l.slug).join(', '))

  if (!COMMIT) {
    const cmFile = writePreview('category-marketing.seed.json', categoryMarketingSeed)
    const locFile = writePreview('service-catalog-localities.seed.json', localities)
    console.log('\nDry run complete. Previews written:')
    console.log(' •', cmFile)
    console.log(' •', locFile)
    console.log('\nReview the JSON, then re-run with:  SEED_ADMIN_TOKEN="<jwt>" node scripts/seed-mmr-electrician.mjs --commit')
    return
  }

  if (!TOKEN) {
    console.error('\n✗ --commit requires SEED_ADMIN_TOKEN (a dashboard JWT with CMS permissions).')
    process.exit(1)
  }

  // 1) Category marketing — merge into the existing blob so other keys are preserved.
  console.log('\n→ Fetching current category-marketing blob…')
  const existing = await getJson(CM_PATH)
  const merged = { ...existing, ...categoryMarketingSeed }
  console.log(`→ Writing ${keys.length} key(s) (total keys after merge: ${Object.keys(merged).length})…`)
  await putJson(CM_PATH, merged)
  console.log('✓ category-marketing saved.')

  // 2) Localities — upsert by slug (create if missing, update if present).
  console.log('\n→ Syncing service-catalog-localities…')
  let current = []
  try {
    current = await getJson(LOC_PATH)
  } catch (e) {
    console.warn('  (could not list existing localities, will attempt create only):', e.message)
  }
  const bySlug = new Map((Array.isArray(current) ? current : []).map((r) => [r.slug, r]))
  for (const loc of localities) {
    const found = bySlug.get(loc.slug)
    if (found?._id) {
      await putJson(`${LOC_PATH}/${encodeURIComponent(found._id)}`, loc)
      console.log(`  ✓ updated locality: ${loc.slug}`)
    } else {
      await postJson(LOC_PATH, loc)
      console.log(`  ✓ created locality: ${loc.slug}`)
    }
  }

  console.log('\n✓ Done. Verify in Admin → CMS → Industry service pages (?tab=landing) for the electrician keys.')
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
