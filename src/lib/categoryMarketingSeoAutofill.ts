/**
 * Opinionated hyperlocal SEO scaffolding for `CategoryMarketingConfig` locality keys
 * (`{industry}__{locality-slug}`). Editors should review NAP, canonicals, and ratings before publish.
 */
import type { CategoryMarketingConfig, FaqBlock, RelatedLinkBlock } from '../types/categoryMarketing'
import {
  META_DESC_HARD_MAX_CHARS,
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_HARD_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
} from '../components/blog/blog-seo-guidelines'

export type CategoryMarketingSeoAutofillInput = {
  industrySlug: string
  industryLabel: string
  localitySlug: string
  localityLabel: string
  /** Public site origin, no trailing slash (e.g. https://www.profixer.in) */
  publicOrigin: string
  /** Used in service-area narrative when not using CMS tokens */
  defaultMetroName?: string
}

function trimEndEllipsis(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, Math.max(0, max - 1)).trimEnd()
  return `${cut}…`
}

function fitSeoTitle(service: string, location: string, max: number): string {
  const brand = ' | Profixer'
  let core = `${service} in ${location}`
  if (`${core}${brand}`.length <= max) return `${core}${brand}`
  while (core.length > 8 && `${core}${brand}`.length > max) {
    const parts = core.split(' ')
    if (parts.length > 2) parts.pop()
    else break
    core = parts.join(' ').replace(/\s+in\s*$/i, ` in ${location.split(' ')[0] || location}`)
  }
  let out = `${core}${brand}`
  if (out.length > max) out = trimEndEllipsis(`${service} — ${location}`, max)
  return out.length < SEO_TITLE_MIN_CHARS ? trimEndEllipsis(`${service} in ${location} online`, max) : out
}

function siteLabel(origin: string): string {
  try {
    const h = new URL(origin).hostname
    return h.replace(/^www\./, '') || origin
  } catch {
    return 'your site'
  }
}

function defaultFaqsForLocality(input: {
  industryLabel: string
  localityLabel: string
  locShort: string
  origin: string
  metro: string
}): FaqBlock[] {
  const { industryLabel, localityLabel, locShort, origin, metro } = input
  const site = siteLabel(origin)
  const bookUrl = `${origin}/book`
  const servicesUrl = `${origin}/services`

  return [
    {
      question: `How do I book ${industryLabel.toLowerCase()} in ${localityLabel}?`,
      answer: `Choose your service on <a href="${origin}/" rel="noopener">${site}</a>, pick a slot, and share your full address plus any photos that help diagnosis. You can also start from <a href="${bookUrl}" rel="noopener">the booking page</a> if your product routes there.`,
    },
    {
      question: `Do you offer same-day ${industryLabel.toLowerCase()} visits in ${locShort}?`,
      answer: `Same-day slots depend on partner availability in ${metro} and your exact pincode. Book early in the day for the best chance; we show live availability where the product supports it.`,
    },
    {
      question: 'How does pricing work?',
      answer: `Most visits start with an inspection or scope check, then a clear estimate before material-heavy work. You get a digital invoice after the job; warranty terms follow your published policy for this category.`,
    },
    {
      question: 'What should I prepare before the partner arrives?',
      answer: `Clear access to the work area, society gate pass rules if applicable, and photos of the issue. For shared utilities or meter rooms, confirm access with your society office where needed.`,
    },
    {
      question: 'Can I cancel or reschedule?',
      answer: `Yes — use the same channel you booked through (app or web). Late cancellations may follow your cancellation policy; update this answer to match your live terms.`,
    },
    {
      question: `Is ${localityLabel} fully covered?`,
      answer: `We aim to cover ${locShort} and adjacent pockets in ${metro}. Edge cases (very narrow lanes, restricted zones) may need ETA confirmation at booking—edit this line to match operations.`,
    },
  ]
}

function defaultRelatedLinks(origin: string, industrySlug: string): RelatedLinkBlock[] {
  const o = origin.replace(/\/$/, '')
  return [
    { label: 'Home', url: `${o}/` },
    { label: 'All services', url: `${o}/services` },
    { label: 'Book online', url: `${o}/book` },
    { label: 'This category (all areas)', url: `${o}/services/${industrySlug}` },
  ]
}

function fitMetaDescription(parts: { service: string; location: string; metro: string }): string {
  const { service, location, metro } = parts
  const base = `Book verified ${service.toLowerCase()} in ${location} (${metro}). Clear scope, trained partners, digital invoices — schedule online on Profixer.`
  let out = base
  if (out.length > META_DESC_HARD_MAX_CHARS) out = trimEndEllipsis(base, META_DESC_HARD_MAX_CHARS)
  if (out.length < META_DESC_MIN_CHARS) {
    out = `${base} Same-day slots subject to availability.`
    if (out.length > META_DESC_HARD_MAX_CHARS) out = trimEndEllipsis(out, META_DESC_HARD_MAX_CHARS)
  }
  if (out.length > META_DESC_OPTIMAL_MAX_CHARS + 6) {
    out = trimEndEllipsis(out, META_DESC_OPTIMAL_MAX_CHARS)
  }
  return out
}

export function buildLocalitySeoAutofillPack(input: CategoryMarketingSeoAutofillInput): Partial<CategoryMarketingConfig> {
  const {
    industrySlug,
    industryLabel,
    localitySlug,
    localityLabel,
    publicOrigin,
    defaultMetroName = 'Mumbai',
  } = input

  const origin = publicOrigin.replace(/\/$/, '')
  const slugPath = `/services/${industrySlug.replace(/^\/+|\/+$/g, '')}/${localitySlug.replace(/^\/+|\/+$/g, '')}`
  const canonicalUrl = `${origin}${slugPath}`

  const primaryKeyword = `${industryLabel} in ${localityLabel}`.replace(/\s+/g, ' ').trim()
  const locShort = localityLabel.split(',')[0]?.trim() || localityLabel

  const seoTitle = fitSeoTitle(industryLabel, localityLabel, SEO_TITLE_HARD_MAX_CHARS)
  const metaDescription = fitMetaDescription({
    service: industryLabel,
    location: localityLabel,
    metro: defaultMetroName,
  })

  const secondaryKeywords = Array.from(
    new Set(
      [
        `${industryLabel.toLowerCase()} ${locShort.toLowerCase()}`,
        `${industryLabel.toLowerCase()} near me ${locShort.toLowerCase()}`,
        `${industryLabel.toLowerCase()} ${localitySlug.replace(/-/g, ' ')}`,
        `best ${industryLabel.toLowerCase()} ${locShort.toLowerCase()}`,
        `same day ${industryLabel.toLowerCase()} ${locShort.toLowerCase()}`,
        `${industryLabel.toLowerCase()} booking online`,
        `${locShort.toLowerCase()} ${industryLabel.toLowerCase()} service`,
      ].filter(Boolean),
    ),
  )

  const intro = `<p>Looking for <strong>${industryLabel.toLowerCase()}</strong> in <strong>${localityLabel}</strong>? Profixer routes vetted partners across <strong>${defaultMetroName}</strong> with inspection-first quotes and tidy visits.</p><p>Use this page to understand what we cover in ${locShort}, how booking works, and what to prepare before the partner arrives.</p>`

  const answerEngineSummary = `Profixer offers ${industryLabel.toLowerCase()} in ${localityLabel}: verified partners, transparent estimates, and digital invoices. Coverage is tuned for ${defaultMetroName}; confirm slot availability at booking.`

  const serviceAreaNarrative = `We operate ${industryLabel.toLowerCase()} teams serving ${localityLabel} and nearby pockets within ${defaultMetroName}. Routing follows live traffic and partner density—confirm ETA at booking if you are on the edge of the zone.`

  const now = new Date()
  const contentModifiedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const faqs = defaultFaqsForLocality({
    industryLabel,
    localityLabel,
    locShort,
    origin,
    metro: defaultMetroName,
  })
  const relatedLinks = defaultRelatedLinks(origin, industrySlug)

  return {
    seoTitle,
    metaDescription,
    urlSlugPattern: slugPath,
    primaryKeyword,
    secondaryKeywords,
    mainHeading: `${industryLabel} in ${localityLabel}`,
    heroTrustBadge: `Verified ${industryLabel.toLowerCase()} · ${locShort}`,
    heroChip: `${defaultMetroName} service area`,
    heroProofPoints: [
      'Inspection-first quotes',
      'Digital invoices & support',
      'Trained partner network',
    ],
    topicChips: [
      'Online booking',
      'Same-day slots',
      'Transparent pricing',
      'Warranty as per policy',
    ],
    intro,
    faqs,
    relatedLinks,
    localityGuide: {
      enabled: true,
      expandDetailsByDefault: false,
      articleH2: `Local guide: ${industryLabel} in ${localityLabel}`,
      leadParagraphs: [
        `${localityLabel} sits inside ${defaultMetroName}’s service demand curve—short notice visits, society access rules, and parking time all affect how quickly a partner can reach you.`,
        `This guide explains what Profixer covers in ${locShort}, how we price, and how to get the fastest resolution on the first visit.`,
      ],
      sections: [
        {
          h2: `What customers in ${locShort} book most`,
          paragraphs: [
            `Typical ${industryLabel.toLowerCase()} jobs here mirror wider ${defaultMetroName} trends—planned upgrades plus urgent fixes after load or weather stress.`,
            `Tell us the exact room, photos of the problem area, and society gate rules when you book so we can dispatch the right partner with the right kit.`,
          ],
        },
        {
          h2: 'How Profixer keeps quality consistent',
          paragraphs: [
            'Partners are onboarded with document checks; you get clear scope before material-heavy work begins.',
            'If something is unsafe or out of scope, we say so upfront instead of improvising hidden surcharges.',
          ],
        },
      ],
      summaryLead: `Book ${industryLabel.toLowerCase()} in ${localityLabel} with clear estimates and accountable support.`,
      takeaways: [
        'Photos + exact address speed up dispatch',
        'Ask for scope in writing before major work',
        'Keep your invoice for warranty claims',
        'Peak slots fill fast—book early',
      ],
      jsonLdBrandServiceName: `Profixer ${industryLabel} — ${localityLabel}`,
      useFaqsForSchema: true,
      showInboundLinkStrip: true,
      showBookingCtaStrip: true,
    },
    localSeo: {
      enableLocalBusinessSchema: false,
      localProfileName: `Profixer ${industryLabel} (${localityLabel})`,
      serviceAreaHeadline: 'Areas we serve near [Location] & [City]',
      serviceAreaPlaceNames: [localityLabel, locShort, defaultMetroName],
      serviceAreaNarrative,
      localIntentKeywords: secondaryKeywords.slice(0, 8),
      openingHoursSummary: 'Daily 8:00 am – 8:00 pm (example — replace with real hours)',
      googleBusinessProfileUrl: '',
      sameAsUrls: [],
      streetAddress: '',
      addressLocality: localityLabel,
      addressRegion: 'Maharashtra',
      postalCode: '',
      addressCountryCode: 'IN',
      geoLatLng: '',
      priceRange: '₹₹',
      ogImageOverride: '',
    },
    technicalSeo: {
      canonicalUrl,
      ogTitle: trimEndEllipsis(seoTitle, 70),
      ogDescription: trimEndEllipsis(metaDescription, 200),
      ogImageAlt: `${industryLabel} service in ${localityLabel} — Profixer`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterSite: '',
      twitterCreator: '',
      robotsMeta: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      hreflangAlternates: [],
      knowsAbout: [
        industryLabel,
        `${industryLabel} ${defaultMetroName}`,
        'Home services India',
        'Online booking',
      ],
      schemaPrimaryType: 'HomeAndConstructionBusiness',
      enableHowToSchema: true,
      enableBreadcrumbSchema: true,
      breadcrumbItems: [
        { name: 'Home', url: `${origin}/` },
        { name: 'Services', url: `${origin}/services` },
        { name: industryLabel, url: `${origin}/services/${industrySlug}` },
        { name: localityLabel, url: canonicalUrl },
      ],
      speakableSelectors: ['article h1', '.answer-engine-summary', '[data-faq-answer]'],
      answerEngineSummary,
      contentModifiedDate,
      aggregateRating: { ratingValue: '', reviewCount: '' },
      videoEmbedUrls: [],
      enableWebPageSchema: true,
      enableServiceOfferSchema: true,
    },
    jsonLdExtra:
      'Consumer should emit Service + FAQPage (+ BreadcrumbList) from CMS fields. Leave aggregateRating empty unless the same numbers are visible on this URL. Add LocalBusiness JSON-LD only when NAP is verified.',
    closingParagraph: `Ready for ${industryLabel.toLowerCase()} in ${localityLabel}? Pick a slot, add photos if it helps diagnosis, and we will match you with a Profixer partner in ${defaultMetroName}.`,
  }
}
