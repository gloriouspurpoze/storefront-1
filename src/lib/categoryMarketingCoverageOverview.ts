import type { CategoryMarketingConfig } from '../types/categoryMarketing'

export type CoverageCheckItem = {
  id: string
  label: string
  done: boolean
}

export type CoverageSection = {
  id: string
  title: string
  description?: string
  items: CoverageCheckItem[]
}

const nonempty = (s: string | undefined) => Boolean(String(s ?? '').trim())

/** Admin-facing checklist: what’s filled for the current Industry × Location JSON slice. */
export function buildCategoryMarketingCoverageSections(cfg: CategoryMarketingConfig): CoverageSection[] {
  const metaLen = cfg.metaDescription.trim().length
  const metaLengthBand = metaLen >= 70 && metaLen <= 170

  return [
    {
      id: 'search',
      title: 'Search appearance',
      description: 'Titles, descriptions, and primary keyword.',
      items: [
        { id: 'seoTitle', label: 'SEO title set', done: nonempty(cfg.seoTitle) },
        {
          id: 'metaDescription',
          label: 'Meta description present',
          done: nonempty(cfg.metaDescription),
        },
        {
          id: 'metaLength',
          label: 'Meta length in SERP band (≈70–170 chars)',
          done: metaLengthBand,
        },
        { id: 'primaryKeyword', label: 'Primary keyword', done: nonempty(cfg.primaryKeyword) },
        { id: 'urlSlugPattern', label: 'URL slug pattern', done: nonempty(cfg.urlSlugPattern) },
      ],
    },
    {
      id: 'hero',
      title: 'Hero & intro',
      description: 'What visitors see first on the service page.',
      items: [
        { id: 'mainHeading', label: 'Main heading (H1 source)', done: nonempty(cfg.mainHeading) },
        { id: 'intro', label: 'Intro / lead copy', done: nonempty(cfg.intro) },
        { id: 'image1', label: 'Hero image', done: nonempty(cfg.image1) },
        {
          id: 'heroExtras',
          label: 'Trust badge, chip, or proof lines',
          done:
            nonempty(cfg.heroTrustBadge) ||
            nonempty(cfg.heroChip) ||
            (cfg.heroProofPoints?.some((x) => nonempty(x)) ?? false),
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Service content blocks',
      items: [
        {
          id: 'serviceCards',
          label: 'Service cards (grid)',
          done: cfg.serviceCards.some((c) => nonempty(c.title)),
        },
        {
          id: 'serviceTypes',
          label: 'Detailed service types',
          done: cfg.serviceTypes.some((t) => nonempty(t.title)),
        },
        {
          id: 'topicChips',
          label: 'Topic chips or secondary keywords',
          done:
            cfg.topicChips.some((x) => nonempty(x)) ||
            cfg.secondaryKeywords.some((x) => nonempty(x)),
        },
      ],
    },
    {
      id: 'trust',
      title: 'Trust & areas',
      items: [
        {
          id: 'trustBenefits',
          label: 'Trust / why-us blocks',
          done: cfg.trustBenefits.some((b) => nonempty(b.heading)),
        },
        {
          id: 'ways',
          label: '“How it works” section',
          done: nonempty(cfg.waysHeading) || cfg.waysBullets.some((x) => nonempty(x)),
        },
        {
          id: 'areas',
          label: 'Areas served copy or list',
          done:
            nonempty(cfg.areasCopy) ||
            cfg.areasList.some((a) => nonempty(a)) ||
            nonempty(cfg.areasCta),
        },
      ],
    },
    {
      id: 'pricing',
      title: 'Pricing & booking',
      items: [
        {
          id: 'spareParts',
          label: 'Spare parts / rate hints',
          done: cfg.spareParts.some((p) => nonempty(p.name)),
        },
        {
          id: 'booking',
          label: 'Booking steps or contact',
          done:
            cfg.bookingSteps.some((s) => nonempty(s.title)) ||
            nonempty(cfg.contactPhone) ||
            nonempty(cfg.contactWhatsapp),
        },
      ],
    },
    {
      id: 'faqs',
      title: 'FAQs & links',
      items: [
        {
          id: 'faqs',
          label: 'FAQs with Q & A',
          done: cfg.faqs.some((f) => nonempty(f.question) && nonempty(f.answer)),
        },
        {
          id: 'relatedLinks',
          label: 'Related internal links',
          done: cfg.relatedLinks.some((l) => nonempty(l.url)),
        },
        { id: 'closing', label: 'Closing paragraph', done: nonempty(cfg.closingParagraph) },
      ],
    },
    {
      id: 'nearMe',
      title: 'Near-me pages',
      description: 'Programmatic `/near-me/{category}/{locality}` SEO overrides.',
      items: [
        {
          id: 'nearMeTitle',
          label: 'Near-me title (or consumer default)',
          done: nonempty(cfg.nearMeSeo?.title),
        },
        {
          id: 'nearMeDescription',
          label: 'Near-me meta description',
          done: nonempty(cfg.nearMeSeo?.description),
        },
        {
          id: 'nearMeKeywords',
          label: 'Near-me keywords',
          done: (cfg.nearMeSeo?.keywords?.some((k) => nonempty(k)) ?? false),
        },
      ],
    },
    {
      id: 'nap',
      title: 'NAP & citations',
      description: 'Name, address, phone, GBP, and directory links for local SEO.',
      items: [
        { id: 'napPhone', label: 'Business phone', done: nonempty(cfg.contactPhone) },
        {
          id: 'napStreet',
          label: 'Street address',
          done: nonempty(cfg.localSeo?.streetAddress),
        },
        {
          id: 'napLocality',
          label: 'City / locality',
          done: nonempty(cfg.localSeo?.addressLocality),
        },
        { id: 'napPostal', label: 'Postal code (PIN)', done: nonempty(cfg.localSeo?.postalCode) },
        {
          id: 'napGbp',
          label: 'Google Business Profile URL',
          done: nonempty(cfg.localSeo?.googleBusinessProfileUrl),
        },
        {
          id: 'napSameAs',
          label: 'Citation URLs (sameAs)',
          done: (cfg.localSeo?.sameAsUrls?.some((u) => nonempty(u)) ?? false),
        },
        {
          id: 'napSchema',
          label: 'LocalBusiness schema enabled (when NAP verified)',
          done: cfg.localSeo?.enableLocalBusinessSchema === true,
        },
      ],
    },
    {
      id: 'hyperlocal',
      title: 'Hyperlocal & technical SEO',
      description: 'Especially important when a location is selected.',
      items: [
        {
          id: 'localityGuide',
          label: 'Locality guide article enabled + copy',
          done:
            cfg.localityGuide?.enabled === true &&
            (nonempty(cfg.localityGuide.articleH2) ||
              nonempty(cfg.localityGuide.summaryLead) ||
              (cfg.localityGuide.sections?.some(
                (s) => nonempty(s.h2) || (s.paragraphs?.some((p) => nonempty(p)) ?? false),
              ) ?? false)),
        },
        {
          id: 'localSeo',
          label: 'Local SEO (areas, profile, schema toggles)',
          done:
            cfg.localSeo?.enableLocalBusinessSchema === true ||
            nonempty(cfg.localSeo?.localProfileName) ||
            (cfg.localSeo?.serviceAreaPlaceNames?.some((p) => nonempty(p)) ?? false),
        },
        {
          id: 'technicalSeo',
          label: 'Technical SEO (canonical, OG, robots, answer summary)',
          done:
            nonempty(cfg.technicalSeo?.canonicalUrl) ||
            nonempty(cfg.technicalSeo?.ogTitle) ||
            nonempty(cfg.technicalSeo?.robotsMeta) ||
            nonempty(cfg.technicalSeo?.answerEngineSummary),
        },
        {
          id: 'jsonLd',
          label: 'Extra JSON-LD notes',
          done: nonempty(cfg.jsonLdExtra),
        },
      ],
    },
  ]
}

export function coverageCompletionRatio(sections: CoverageSection[]): { filled: number; total: number } {
  let filled = 0
  let total = 0
  for (const s of sections) {
    for (const i of s.items) {
      total += 1
      if (i.done) filled += 1
    }
  }
  return { filled, total }
}

/** Keys in the JSON blob that belong to this catalog industry (base + locality composites). */
export function listSavedKeysForIndustry(
  data: Record<string, unknown>,
  industrySlug: string,
): string[] {
  const base = industrySlug.trim()
  if (!base) return []
  const prefix = `${base}__`
  const keys = Object.keys(data).filter((k) => k === base || k.startsWith(prefix))
  keys.sort((a, b) => {
    if (a === base) return -1
    if (b === base) return 1
    return a.localeCompare(b, undefined, { sensitivity: 'base' })
  })
  return keys
}

export function localitySlugFromCompositeKey(industrySlug: string, storageKey: string): string | null {
  if (storageKey === industrySlug) return ''
  const prefix = `${industrySlug}__`
  if (storageKey.startsWith(prefix)) return storageKey.slice(prefix.length)
  return null
}
