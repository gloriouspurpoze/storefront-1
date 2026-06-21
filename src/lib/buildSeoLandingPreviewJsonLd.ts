import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import { kindMeta, publicUrlForKind } from './seoLandingPageKinds'
import {
  effectiveSeoLandingMetaDescription,
  resolveSeoLandingLocationLabel,
} from './seoLandingEffectiveMeta'
import { normalizeSeoCategorySlug } from './seoLandingCatalogSlugs'

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

function collectFaqs(draft: Record<string, unknown>): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = []
  const push = (items: unknown[]) => {
    for (const f of items) {
      if (!f || typeof f !== 'object') continue
      const o = f as Record<string, unknown>
      const q = stripHtml(o.question)
      const a = stripHtml(o.answer)
      if (q && a) out.push({ question: q, answer: a })
    }
  }
  if (Array.isArray(draft.faqs)) push(draft.faqs)
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    if (sec.type === 'faqs' && Array.isArray(sec.faqs)) push(sec.faqs)
  }
  return out
}

function collectHowToSteps(draft: Record<string, unknown>): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = []
  if (Array.isArray(draft.howToSteps)) {
    for (const st of draft.howToSteps) {
      if (!st || typeof st !== 'object') continue
      const o = st as Record<string, unknown>
      const name = stripHtml(o.name)
      const text = stripHtml(o.text)
      if (name && text) out.push({ name, text })
    }
  }
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    if (sec.type === 'how_to' && Array.isArray(sec.steps)) {
      for (const st of sec.steps) {
        if (!st || typeof st !== 'object') continue
        const o = st as Record<string, unknown>
        const name = stripHtml(o.name)
        const text = stripHtml(o.text)
        if (name && text) out.push({ name, text })
      }
    }
  }
  return out
}

function serviceLabel(draft: Record<string, unknown>, catalogLabelMap: Record<string, string>): string {
  const slug = normalizeSeoCategorySlug(String(draft.serviceSlug ?? draft.service ?? ''))
  if (!slug) return 'Home service'
  return catalogLabelMap[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function localityLabel(draft: Record<string, unknown>): string {
  return resolveSeoLandingLocationLabel(draft) ?? 'Mumbai'
}

/** JSON-LD preview aligned with consumer `pageJsonLd.ts` intent. */
export function buildSeoLandingSchemaPreview(
  kind: SeoLandingEntityKind,
  slug: string,
  draft: Record<string, unknown>,
  catalogLabelMap: Record<string, string> = {},
): SeoLandingSchemaPreview {
  const normalizedSlug = slug.trim()
  const path = publicUrlForKind(kind, normalizedSlug, draft)
  const pageUrl = `${ORIGIN}${path}`
  const title = stripHtml(draft.title ?? draft.name ?? normalizedSlug)
  const description =
    stripHtml(draft.quickAnswer ?? draft.bio ?? draft.subtitle ?? '') ||
    effectiveSeoLandingMetaDescription(kind, draft, catalogLabelMap).value
  const faqItems = collectFaqs(draft)
  const howToSteps = collectHowToSteps(draft)
  const faqReady = faqItems.length > 0
  const howToReady = howToSteps.length > 0
  const serviceSlug = String(draft.serviceSlug ?? '').trim()
  const loc = localityLabel(draft)
  const svcName = serviceSlug ? `${serviceLabel(draft, catalogLabelMap)} in ${loc}` : title

  const graph: Record<string, unknown>[] = []
  const nodes: SeoLandingSchemaNode[] = []
  const footnotes = [
    'Matches live @graph structure — omitted nodes (HowTo/FAQ) are not emitted on profixer.in when empty.',
    'Speakable: [data-speakable="quick-answer"], [data-speakable="key-takeaways"].',
  ]

  const push = (
    type: string,
    id: string,
    body: Record<string, unknown>,
    ready = true,
    note?: string,
  ) => {
    graph.push({ '@type': type, '@id': id, ...body })
    nodes.push({ type, id, ready, note })
  }

  push('WebPage', pageUrl, {
    url: pageUrl,
    name: title || '—',
    ...(description ? { description } : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="quick-answer"]', '[data-speakable="key-takeaways"]'],
    },
  })

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
      push('Article', `${pageUrl}#article`, {
        headline: title,
        description,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        inLanguage: 'en-IN',
      }, Boolean(title && description))
      if (howToReady) {
        push('HowTo', `${pageUrl}#howto`, {
          name: title,
          description,
          step: howToSteps.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        })
      } else {
        nodes.push({
          type: 'HowTo',
          id: `${pageUrl}#howto`,
          ready: false,
          note: 'Add How-to section with steps — omitted on live site until present',
        })
      }
      push(
        'Service',
        `${pageUrl}#service`,
        {
          name: svcName,
          description: stripHtml((draft.seo as Record<string, unknown> | undefined)?.description) || description,
          serviceType: serviceLabel(draft, catalogLabelMap),
          areaServed: { '@type': 'Place', name: loc },
          provider: { '@id': `${ORIGIN}#organization` },
        },
        Boolean(serviceSlug),
        serviceSlug ? undefined : 'Set service category in Setup',
      )
      push(
        'LocalBusiness',
        `${pageUrl}#localbusiness`,
        {
          name: 'ProFixer',
          areaServed: [{ '@type': 'City', name: 'Mumbai' }, { '@type': 'Place', name: loc }],
          parentOrganization: { '@id': `${ORIGIN}#organization` },
        },
        true,
        'Full NAP/geo from site constants on live site',
      )
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      } else {
        nodes.push({
          type: 'FAQPage',
          id: `${pageUrl}#faq`,
          ready: false,
          note: 'Add FAQ pairs — omitted on live site when empty',
        })
      }
      break
    case 'emergency':
      push('Article', `${pageUrl}#article`, {
        headline: title,
        description,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        inLanguage: 'en-IN',
      }, Boolean(title && description))
      push(
        'Service',
        `${pageUrl}#service`,
        {
          name: svcName || `Emergency ${serviceLabel(draft, catalogLabelMap)} in ${loc}`,
          description,
          serviceType: serviceLabel(draft, catalogLabelMap),
          areaServed: { '@type': 'Place', name: loc },
          provider: { '@id': `${ORIGIN}#organization` },
        },
        Boolean(serviceSlug && draft.locationSlug),
        !draft.locationSlug ? 'Set service area in Setup' : undefined,
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer', areaServed: loc }, true)
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      } else {
        nodes.push({
          type: 'FAQPage',
          id: `${pageUrl}#faq`,
          ready: false,
          note: 'Add emergency FAQs — response time, surcharge, what counts as urgent',
        })
      }
      break
    case 'cost-guides':
      push('Article', `${pageUrl}#article`, { headline: title, description }, Boolean(title && description))
      push(
        'Service',
        `${pageUrl}#service`,
        {
          name: svcName,
          description,
          serviceType: serviceLabel(draft, catalogLabelMap),
          areaServed: { '@type': 'Place', name: loc },
          offers: 'OfferCatalog from price table rows',
        },
        Boolean(serviceSlug),
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer', areaServed: loc }, true)
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      }
      break
    case 'guides':
      push('Article', `${pageUrl}#article`, { headline: title, description }, Boolean(title && description))
      if (howToReady) {
        push('HowTo', `${pageUrl}#howto`, {
          name: title,
          step: howToSteps.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        })
      }
      if (serviceSlug) {
        push('Service', `${pageUrl}#service`, { name: svcName, areaServed: loc }, true)
        push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer', areaServed: loc }, true)
      }
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      }
      break
    case 'providers':
      push(
        'Person',
        `${pageUrl}#person`,
        { name: stripHtml(draft.name), description: stripHtml(draft.bio) },
        Boolean(stripHtml(draft.name)),
      )
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      }
      break
    case 'locations':
      push(
        'LocalBusiness',
        `${pageUrl}#localbusiness`,
        { name: stripHtml(draft.name), description, areaServed: stripHtml(draft.name) },
        Boolean(stripHtml(draft.name)),
      )
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      }
      break
    case 'landing-pages':
      push(
        'Service',
        `${pageUrl}#service`,
        {
          name: svcName,
          description,
          areaServed: String(draft.locationName ?? loc),
          offers: 'OfferCatalog when price table set',
        },
        Boolean(serviceSlug && draft.locationSlug),
      )
      push('LocalBusiness', `${pageUrl}#localbusiness`, { name: 'ProFixer', areaServed: loc }, true)
      if (faqReady) {
        push('FAQPage', `${pageUrl}#faq`, {
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        })
      }
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
    'Problem-intent stack: WebPage + Article + Service (category × area) + LocalBusiness. HowTo only when steps exist; FAQ only with Q&A pairs.',
  'cost-guides':
    'Price-intent: Service with OfferCatalog from charge table + Article + LocalBusiness + optional FAQ.',
  guides:
    'Informational: HowTo when steps exist; Service/LocalBusiness when category is set — funnels to booking.',
  emergency:
    'Urgent-intent: WebPage + Service (emergency {category} in {area}) + LocalBusiness + FAQ. Separate CMS content from problem pages.',
  providers: 'E-E-A-T: Person + FAQ. Keep bio factual.',
  locations: 'Local hub: LocalBusiness for the area + FAQ. Link to /services/ and neighbour areas.',
  'landing-pages':
    'Money page: Service + LocalBusiness on self-canonical URL. Funnel canonical to /services/… only when deduping.',
}
