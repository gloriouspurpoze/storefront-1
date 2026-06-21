import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import { kindMeta, publicUrlForKind } from './seoLandingPageKinds'

const ORIGIN = 'https://www.profixer.in'
const CONTEXT = 'https://schema.org'

export type SeoLandingSchemaNode = {
  type: string
  id: string
  note?: string
  ready: boolean
}

export type SeoLandingSchemaPreview = {
  pageUrl: string
  nodes: SeoLandingSchemaNode[]
  document: { '@context': string; '@graph': Record<string, unknown>[] }
  footnotes: string[]
}

function stripHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasFaqs(draft: Record<string, unknown>): boolean {
  if (!Array.isArray(draft.faqs)) return false
  return draft.faqs.some((f) => {
    if (!f || typeof f !== 'object') return false
    const o = f as Record<string, unknown>
    return Boolean(stripHtml(o.question) && stripHtml(o.answer))
  })
}

function hasHowToSteps(draft: Record<string, unknown>): boolean {
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  if (sections.some((s) => s && typeof s === 'object' && (s as Record<string, unknown>).type === 'how_to')) {
    return true
  }
  return Array.isArray(draft.howToSteps) && draft.howToSteps.length > 0
}

function hasPriceTable(draft: Record<string, unknown>): boolean {
  if (Array.isArray(draft.priceTable) && draft.priceTable.length > 0) return true
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  return sections.some((s) => s && typeof s === 'object' && (s as Record<string, unknown>).type === 'price_table')
}

/** Industry-standard JSON-LD stack per programmatic page type (admin preview). */
export function buildSeoLandingSchemaPreview(
  kind: SeoLandingEntityKind,
  slug: string,
  draft: Record<string, unknown>,
): SeoLandingSchemaPreview {
  const normalizedSlug = slug.trim()
  const path = publicUrlForKind(kind, normalizedSlug)
  const pageUrl = `${ORIGIN}${path}`
  const title = stripHtml(draft.title ?? draft.name ?? normalizedSlug)
  const description = stripHtml(draft.quickAnswer ?? draft.bio ?? draft.subtitle ?? '')
  const faqReady = hasFaqs(draft)
  const howToReady = hasHowToSteps(draft)
  const offersReady = hasPriceTable(draft)
  const graph: Record<string, unknown>[] = []
  const nodes: SeoLandingSchemaNode[] = []
  const footnotes = [
    'Preview mirrors consumer `@graph` intent — live site is authoritative after save.',
    'Speakable targets: [data-speakable="quick-answer"] and [data-speakable="key-takeaways"].',
  ]

  const push = (type: string, id: string, body: Record<string, unknown>, ready = true, note?: string) => {
    graph.push({ '@type': type, '@id': id, ...body })
    nodes.push({ type, id, ready, note })
  }

  push('WebPage', pageUrl, { url: pageUrl, name: title || '—', ...(description ? { description } : {}) })

  const crumbs: { name: string; url: string }[] = [{ name: 'Home', url: `${ORIGIN}/` }]
  const meta = kindMeta(kind)
  if (meta.pathPrefix) {
    crumbs.push({ name: meta.shortLabel, url: `${ORIGIN}${meta.pathPrefix}` })
  }
  crumbs.push({ name: title || normalizedSlug, url: pageUrl })
  push('BreadcrumbList', `${pageUrl}#breadcrumb`, {
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  })

  switch (kind) {
    case 'problems':
      push('Article', `${pageUrl}#article`, { headline: title, description }, Boolean(title && description))
      push(
        'HowTo',
        `${pageUrl}#howto`,
        { name: title, description },
        howToReady,
        howToReady ? 'From how-to sections or howToSteps' : 'Add a How-to block or steps',
      )
      push(
        'Service',
        `${pageUrl}#service`,
        { name: title, description },
        Boolean(draft.serviceSlug),
        'Booking funnel + areaServed',
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer' }, true, 'NAP from site constants + locality')
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady, faqReady ? undefined : 'Add complete FAQ pairs')
      break
    case 'cost-guides':
      push('Article', `${pageUrl}#article`, { headline: title, description }, Boolean(title && description))
      push(
        'Service',
        `${pageUrl}#service`,
        { name: title, offers: offersReady ? 'OfferCatalog from price table' : undefined },
        Boolean(draft.serviceSlug),
        offersReady ? 'Price rows → OfferCatalog' : 'Add charge table for OfferCatalog',
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer' }, true)
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady)
      break
    case 'guides':
      push('Article', `${pageUrl}#article`, { headline: title, description }, Boolean(title && description))
      push('HowTo', `${pageUrl}#howto`, { name: title }, howToReady, howToReady ? undefined : 'Add How-to section')
      if (draft.serviceSlug) {
        push('Service', `${pageUrl}#service`, { name: title }, true)
        push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer' }, true)
      }
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady)
      break
    case 'providers':
      push(
        'Person',
        `${pageUrl}#person`,
        { name: stripHtml(draft.name), description: stripHtml(draft.bio) },
        Boolean(stripHtml(draft.name)),
      )
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady)
      if (Array.isArray(draft.reviews) && draft.reviews.length > 0) {
        push('Review', `${pageUrl}#reviews`, {}, true, `${draft.reviews.length} review(s)`)
      }
      break
    case 'locations':
      push(
        'LocalBusiness',
        `${pageUrl}#localbusiness`,
        { name: stripHtml(draft.name), description },
        Boolean(stripHtml(draft.name)),
        'Area hub — stats feed aggregateRating when set',
      )
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady)
      break
    case 'landing-pages':
      push(
        'Service',
        `${pageUrl}#service`,
        { name: title, offers: offersReady ? 'OfferCatalog' : undefined },
        Boolean(draft.serviceSlug && draft.locationName),
        'Local money page primary entity',
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer' }, true)
      push('FAQPage', `${pageUrl}#faq`, {}, faqReady)
      break
  }

  return {
    pageUrl,
    nodes,
    document: { '@context': CONTEXT, '@graph': graph },
    footnotes,
  }
}

export const SCHEMA_INDUSTRY_NOTES: Record<SeoLandingEntityKind, string> = {
  problems:
    'Problem-intent: Article + HowTo (fix steps) + Service (book) + FAQ. Avoid duplicate Article nodes — consumer emits one graph per URL.',
  'cost-guides':
    'Price-intent: Service with OfferCatalog from your charge table + Article for editorial trust + FAQ for “how much” queries.',
  guides:
    'Informational: HowTo is primary rich result; Article + Service funnel to booking when category is set.',
  providers: 'E-E-A-T: Person (+ Review when published) + FAQ. Keep bio factual; no fake ratings.',
  locations: 'Local hub: LocalBusiness anchored to area + FAQ. Pair with internal links to /services/… and /near-me/….',
  'landing-pages':
    'Money page: Service + LocalBusiness + FAQ on a self-canonical WebPage. Use canonical override only to dedupe with /services/….',
}
