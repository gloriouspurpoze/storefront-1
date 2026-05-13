import type { CategoryMarketingConfig } from '../types/categoryMarketing'
import { mergeCategoryConfig } from '../types/categoryMarketing'

const CONTEXT = 'https://schema.org'

/** Best-effort public URL for previews (canonical → slug pattern → key heuristic). */
export function resolveIndustryLandingPreviewUrl(
  cfg: CategoryMarketingConfig,
  effectiveKey: string,
  origin: string,
): string {
  const o = origin.replace(/\/$/, '')
  const can = cfg.technicalSeo.canonicalUrl.trim()
  if (/^https?:\/\//i.test(can)) return can
  const pat = cfg.urlSlugPattern.trim()
  if (/^https?:\/\//i.test(pat)) return pat
  const pathPart = pat.replace(/^\//, '')
  if (pathPart) return `${o}/${pathPart}`
  const sep = effectiveKey.indexOf('__')
  const cat = sep === -1 ? effectiveKey : effectiveKey.slice(0, sep)
  const loc = sep === -1 ? '' : effectiveKey.slice(sep + 2)
  if (loc) return `${o}/services/${cat}/${loc}`
  return `${o}/services/${cat}`
}

function nonempty(s: string | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

export interface IndustryLandingJsonLdPreviewResult {
  /** Single JSON-LD document for display (not identical to consumer output). */
  document: { '@context': string; '@graph': unknown[] }
  footnotes: string[]
  /** Raw `jsonLdExtra` when present (valid JSON or null). */
  jsonLdExtraParsed: unknown | null
}

/**
 * Builds an approximate `@graph` for admin preview only.
 * fixer-client may merge static fallbacks, strip empty nodes, or attach ratings differently.
 */
export function buildIndustryLandingPreviewJsonLd(
  raw: CategoryMarketingConfig,
  effectiveKey: string,
  origin: string,
): IndustryLandingJsonLdPreviewResult {
  const cfg = mergeCategoryConfig(raw)
  const footnotes: string[] = [
    'Approximate JSON-LD: consumer app is authoritative for final `@graph`, merging, and validation.',
  ]
  const graph: unknown[] = []
  const pageUrl = resolveIndustryLandingPreviewUrl(cfg, effectiveKey, origin)

  const title = (cfg.technicalSeo.ogTitle.trim() || cfg.seoTitle.trim() || '—').trim()
  const desc = (cfg.technicalSeo.ogDescription.trim() || cfg.metaDescription.trim() || '').trim()

  if (cfg.technicalSeo.enableWebPageSchema) {
    const wp: Record<string, unknown> = {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
    }
    if (desc) wp.description = desc
    if (cfg.technicalSeo.contentModifiedDate.trim()) {
      wp.dateModified = cfg.technicalSeo.contentModifiedDate.trim()
    }
    const about = cfg.technicalSeo.knowsAbout.map((s) => s.trim()).filter(Boolean)
    if (about.length) wp.about = about
    graph.push(wp)
  } else {
    footnotes.push('WebPage node omitted — enable “Emit WebPage JSON-LD” under Technical SEO.')
  }

  if (cfg.technicalSeo.enableServiceOfferSchema) {
    const primaryType = cfg.technicalSeo.schemaPrimaryType.trim() || 'Service'
    const svc: Record<string, unknown> = {
      '@type': primaryType,
      '@id': `${pageUrl}#service`,
      name: title,
      url: pageUrl,
    }
    if (desc) svc.description = desc
    const rv = cfg.technicalSeo.aggregateRating.ratingValue.trim()
    const rc = cfg.technicalSeo.aggregateRating.reviewCount.trim()
    if (rv && rc) {
      svc.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rv,
        reviewCount: rc,
      }
      footnotes.push('Aggregate rating is shown only for preview — must match visible reviews on the live URL.')
    }
    graph.push(svc)
  } else {
    footnotes.push('Service / offer node omitted — enable “Emit Service / hasOfferCatalog JSON-LD”.')
  }

  if (cfg.localSeo.enableLocalBusinessSchema) {
    const addr: Record<string, unknown> = {}
    if (nonempty(cfg.localSeo.streetAddress)) addr.streetAddress = cfg.localSeo.streetAddress.trim()
    if (nonempty(cfg.localSeo.addressLocality)) addr.addressLocality = cfg.localSeo.addressLocality.trim()
    if (nonempty(cfg.localSeo.addressRegion)) addr.addressRegion = cfg.localSeo.addressRegion.trim()
    if (nonempty(cfg.localSeo.postalCode)) addr.postalCode = cfg.localSeo.postalCode.trim()
    if (nonempty(cfg.localSeo.addressCountryCode)) addr.addressCountryCode = cfg.localSeo.addressCountryCode.trim()

    const lb: Record<string, unknown> = {
      '@type': 'LocalBusiness',
      '@id': `${pageUrl}#localbusiness`,
      name: cfg.localSeo.localProfileName.trim() || title,
      url: pageUrl,
    }
    if (Object.keys(addr).length) lb.address = { '@type': 'PostalAddress', ...addr }
    if (nonempty(cfg.localSeo.openingHoursSummary)) {
      lb.description = `Hours (summary): ${cfg.localSeo.openingHoursSummary.trim()}`
    }
    if (nonempty(cfg.localSeo.priceRange)) lb.priceRange = cfg.localSeo.priceRange.trim()
    const sameAs = [
      ...cfg.localSeo.sameAsUrls.map((u) => u.trim()).filter(Boolean),
      cfg.localSeo.googleBusinessProfileUrl.trim(),
    ].filter(Boolean)
    if (sameAs.length) lb.sameAs = sameAs
    const places = cfg.localSeo.serviceAreaPlaceNames.map((p) => p.trim()).filter(Boolean)
    if (places.length) {
      lb.areaServed = places.map((name) => ({ '@type': 'Place', name }))
    }
    if (nonempty(cfg.localSeo.geoLatLng)) {
      const parts = cfg.localSeo.geoLatLng.split(',').map((s) => s.trim())
      const lat = Number(parts[0])
      const lng = Number(parts[1])
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        lb.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
      }
    }
    graph.push(lb)
  }

  if (cfg.localityGuide.useFaqsForSchema) {
    const entities = cfg.faqs
      .filter((f) => nonempty(f.question) && nonempty(f.answer))
      .map((f) => ({
        '@type': 'Question' as const,
        name: f.question.trim(),
        acceptedAnswer: { '@type': 'Answer' as const, text: f.answer.trim() },
      }))
    if (entities.length) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: entities,
      })
    } else {
      footnotes.push('FAQPage schema toggled on but no complete FAQs in this record.')
    }
  }

  if (cfg.technicalSeo.enableBreadcrumbSchema) {
    const items = cfg.technicalSeo.breadcrumbItems.filter((b) => nonempty(b.name) && nonempty(b.url))
    if (items.length) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: items.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name.trim(),
          item: b.url.trim(),
        })),
      })
    }
  }

  if (cfg.technicalSeo.enableHowToSchema) {
    const steps = cfg.bookingSteps.filter((s) => nonempty(s.title))
    if (steps.length) {
      graph.push({
        '@type': 'HowTo',
        '@id': `${pageUrl}#howto`,
        name: cfg.waysHeading.trim() || 'How booking works',
        step: steps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title.trim(),
          text: s.description.trim() || undefined,
        })),
      })
    }
  }

  const selectors = cfg.technicalSeo.speakableSelectors.map((s) => s.trim()).filter(Boolean)
  if (selectors.length) {
    graph.push({
      '@type': 'SpeakableSpecification',
      '@id': `${pageUrl}#speakable`,
      cssSelector: selectors,
    })
    if (cfg.technicalSeo.answerEngineSummary.trim()) {
      footnotes.push('Speakable selectors are set — consumer may bind them to visible answer-engine copy.')
    }
  }

  cfg.technicalSeo.videoEmbedUrls
    .map((u) => u.trim())
    .filter(Boolean)
    .forEach((url, vi) => {
      graph.push({
        '@type': 'VideoObject',
        '@id': `${pageUrl}#video-${vi}`,
        contentUrl: url,
        embedUrl: url,
      })
    })

  let jsonLdExtraParsed: unknown | null = null
  const extra = cfg.jsonLdExtra.trim()
  if (extra) {
    try {
      jsonLdExtraParsed = JSON.parse(extra) as unknown
      footnotes.push(
        'The “Extra JSON-LD” field is valid JSON — consumer may inject it in addition to generated nodes; it is not merged into the graph above.',
      )
    } catch {
      footnotes.push('“Extra JSON-LD” is not valid JSON — fix before relying on it in production.')
    }
  }

  if (graph.length === 0) {
    footnotes.push('No JSON-LD nodes in preview — enable schema toggles or add valid jsonLdExtra.')
  }

  return {
    document: { '@context': CONTEXT, '@graph': graph },
    footnotes,
    jsonLdExtraParsed,
  }
}
