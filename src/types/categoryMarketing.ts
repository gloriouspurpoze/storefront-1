/**
 * Industry-level service page / catalog marketing config per CMS catalog category key.
 * Stored via PUT /cms/admin/static-content/category-marketing (opaque JSON per category).
 *
 * **Base keys** (e.g. `electric`, `ac`) and **locality keys** (`electric__mumbai`, `ac__bandra-west`) are documented in
 * `src/lib/catalog/cmsAdminContract.ts` — fixer-admin must use the same names.
 */

export interface ServiceTypeBlock {
  title: string
  description: string
  bullets: string[]
}

export interface ServiceCardBlock {
  title: string
  description: string
  price: string
  rating: string
  duration: string
  warranty: string
  bookUrl: string
}

export interface TrustBenefitBlock {
  heading: string
  body: string
}

export interface BookingStepBlock {
  stepNumber: string
  title: string
  description: string
}

export interface SparePartRow {
  name: string
  priceRange: string
}

export interface ComparisonRow {
  label: string
  profixer: string
  others: string
}

export interface FaqBlock {
  question: string
  answer: string
}

export interface RelatedLinkBlock {
  label: string
  url: string
}

/** One H2 block + body paragraphs for `/services/{category}/{locality}` SEO article (hyperlocal CMS records). */
export interface LocalityGuideSectionBlock {
  h2: string
  paragraphs: string[]
}

/**
 * Admin-only local SEO + NAP-style signals for service URLs (base category or `industry__locality` keys).
 * The public site should read these fields from the category-marketing API — do not hardcode service areas or LocalBusiness data in the app bundle.
 */
export interface LocalSeoCmsFields {
  /** When true, consumer may emit LocalBusiness / Service JSON-LD using the fields below. */
  enableLocalBusinessSchema: boolean
  /** Visible / schema name for this local profile (falls back to locality guide / brand rules on consumer if empty). */
  localProfileName: string
  /** Short H2-style line for “Areas we serve” blocks. Supports [City], [Location], [ServiceName]. */
  serviceAreaHeadline: string
  /** Neighborhoods and suburbs for copy + optional `areaServed` in JSON-LD. */
  serviceAreaPlaceNames: string[]
  /** Longer hyperlocal coverage story (unique per locality key). */
  serviceAreaNarrative: string
  /** “Near me”, landmark, and neighborhood-intent phrases. */
  localIntentKeywords: string[]
  /** Human-readable hours for schema or visible strip (consumer may map to OpeningHoursSpecification). */
  openingHoursSummary: string
  /** Google Business Profile or Maps listing URL. */
  googleBusinessProfileUrl: string
  /** Extra `sameAs` URLs (directories, social proof). */
  sameAsUrls: string[]
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  /** ISO 3166-1 alpha-2, e.g. IN */
  addressCountryCode: string
  /** Optional "lat,lng" for `geo` in JSON-LD. */
  geoLatLng: string
  /** e.g. ₹₹ or $–$$$ for schema `priceRange`. */
  priceRange: string
  /** Absolute URL for Open Graph / local landing share image. */
  ogImageOverride: string
}

/**
 * Admin-controlled locality landing copy — stored on composite keys like `electric__mira-bhayandar`.
 * @see `src/lib/catalog/cmsAdminContract.ts`
 */
export interface LocalityGuideCmsFields {
  /** When true, client renders article + structured fields from this record instead of static templates. */
  enabled: boolean
  /** Opens long-form `<details>` blocks by default on the public site. */
  expandDetailsByDefault: boolean
  /** Main H2 under the catalogue (not the page H1). */
  articleH2: string
  leadParagraphs: string[]
  sections: LocalityGuideSectionBlock[]
  summaryLead: string
  takeaways: string[]
  /** Optional override for JSON-LD Service / LocalBusiness `name` on this URL. */
  jsonLdBrandServiceName: string
  /** When true, FAQPage JSON-LD uses the FAQs tab on this same CMS record. */
  useFaqsForSchema: boolean
  /** Renders Related links tab as contextual internal links above the guide nav. */
  showInboundLinkStrip: boolean
  /** Shows call + book strip when enabled (uses global contact constants for phone). */
  showBookingCtaStrip: boolean
}

export interface LeadMagnetBlock {
  headline: string
  description: string
  ctaLabel: string
}

/** Alternate language / region URL for hreflang link tags + consumer JSON-LD. */
export interface HreflangAlternateBlock {
  hreflang: string
  href: string
}

/** Manual BreadcrumbList items when the consumer cannot infer path (name + absolute URL). */
export interface BreadcrumbItemBlock {
  name: string
  url: string
}

/** Optional AggregateRating for JSON-LD — only when values reflect real, visible reviews. */
export interface AggregateRatingCmsFields {
  ratingValue: string
  reviewCount: string
}

/**
 * Technical / SERP / social / structured-data controls for industry service landings.
 * Consumer should map these to `<link rel="canonical">`, Open Graph, Twitter cards, robots, hreflang,
 * WebPage / Service / HowTo / BreadcrumbList / SpeakableSpecification, and entity (`knowsAbout`) fields.
 */
export interface TechnicalSeoCmsFields {
  canonicalUrl: string
  /** Falls back to `seoTitle` on the consumer when empty. */
  ogTitle: string
  /** Falls back to `metaDescription` when empty. */
  ogDescription: string
  /** Alt text for share images — use with `localSeo.ogImageOverride` or default OG image. */
  ogImageAlt: string
  /** Open Graph type, e.g. `website` or `article` (consumer default: `website`). */
  ogType: string
  twitterCard: 'summary' | 'summary_large_image' | ''
  /** @username without @, e.g. profixer_in */
  twitterSite: string
  twitterCreator: string
  /**
   * Raw robots meta content, e.g. `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
   * Leave empty for consumer default (usually indexable).
   */
  robotsMeta: string
  hreflangAlternates: HreflangAlternateBlock[]
  /** Topic strings or Wikipedia / Wikidata URLs for `knowsAbout` (topical + AI entity signals). */
  knowsAbout: string[]
  /** Primary schema.org type hint, e.g. `ProfessionalService`, `HomeAndConstructionBusiness`. */
  schemaPrimaryType: string
  enableHowToSchema: boolean
  enableBreadcrumbSchema: boolean
  breadcrumbItems: BreadcrumbItemBlock[]
  /** CSS selectors for `SpeakableSpecification` (e.g. `.answer-engine-summary`, `article h1`). */
  speakableSelectors: string[]
  /** Short factual “answer-first” blurb for AI overviews / visible key-facts (not keyword stuffing). */
  answerEngineSummary: string
  /** ISO 8601 date (`YYYY-MM-DD` or full datetime) for `dateModified` on WebPage when applicable. */
  contentModifiedDate: string
  aggregateRating: AggregateRatingCmsFields
  videoEmbedUrls: string[]
  enableWebPageSchema: boolean
  enableServiceOfferSchema: boolean
}

export interface CategoryMarketingConfig {
  seoTitle: string
  metaDescription: string
  urlSlugPattern: string
  primaryKeyword: string
  secondaryKeywords: string[]

  /**
   * Service page shell (hero + chips) — SEO-controlled, CMS-first.
   * Consumer should NOT invent fallback marketing copy if these are intentionally empty.
   */
  heroTrustBadge: string
  heroChip: string
  heroProofPoints: string[]
  topicChips: string[]

  mainHeading: string
  intro: string
  introLeadMagnetLabel: string
  introLeadMagnetUrl: string
  image1?: string
  image2?: string

  serviceCards: ServiceCardBlock[]
  /** Eyebrow above the "Our Services" cards grid. Empty → consumer fallback ("Popular options"). */
  serviceCardsEyebrow: string
  /** Heading for the "Our Services" cards grid. Empty → consumer fallback ("Services you can book"). */
  serviceCardsHeading: string

  serviceTypes: ServiceTypeBlock[]
  /** Eyebrow above the service-types ("Service detail") section. Empty → consumer fallback. */
  serviceTypesEyebrow: string
  /** Heading for the service-types section. Empty → consumer fallback (avoids duplicating the page H1). */
  serviceTypesHeading: string

  trustBenefits: TrustBenefitBlock[]
  /** Eyebrow above the "Why homeowners book ProFixer" trust section. Empty → consumer fallback ("Why us"). */
  trustBenefitsEyebrow: string
  /** Heading for the trust section. Empty → consumer fallback ("Why {brand} for {category} in {locality}"). */
  trustBenefitsHeading: string
  waysHeading: string
  waysBullets: string[]

  experienceIncluded: string[]

  areasList: string[]
  areasCta: string
  areasCopy: string
  /** Eyebrow above the "Areas we serve" section. Empty → consumer fallback ("Service area"). */
  areasEyebrow: string
  /** Heading for the "Areas we serve" section. Empty → consumer fallback ("Coverage in [Location]"). */
  areasHeading: string
  /** Locality aside card (FAQ column) — optional overrides; empty fields fall back to mainHeading / intro / code defaults. */
  localityAsideTitle: string
  localityAsideIntro: string
  /** Eyebrow label above the locality aside breadcrumb (e.g. "You are here"). Empty → consumer fallback. */
  localityAsideBreadcrumbLabel: string

  bookingSteps: BookingStepBlock[]
  /** Illustration shown beside the "How to book" numbered steps. Empty → text placeholder. */
  bookingStepsImage?: string
  /** Alt text for `bookingStepsImage` (SEO + a11y). */
  bookingStepsImageAlt?: string
  contactPhone: string
  contactWhatsapp: string

  /** Heading for the pricing matrix section. Empty → consumer fallback ("{Category} charges — indicative rates in {Location}"). */
  pricingHeading: string
  spareParts: SparePartRow[]
  pricingIncluded: string[]
  pricingExcluded: string[]

  comparisonRows: ComparisonRow[]
  faqs: FaqBlock[]
  relatedLinks: RelatedLinkBlock[]

  closingParagraph: string
  leadMagnet: LeadMagnetBlock
  /** Raw JSON-LD or notes; consumer should prefer generating schema from structured fields when possible */
  jsonLdExtra: string

  /** Hyperlocal SEO article + JSON-LD toggles — use composite CMS keys (`electric__mira-bhayandar`). */
  localityGuide: LocalityGuideCmsFields

  /** Local pack / map-pack oriented fields — admin is source of truth for consumer structured data. */
  localSeo: LocalSeoCmsFields

  /** Canonical, social meta, robots, hreflang, schema toggles, and AI/entity signals. */
  technicalSeo: TechnicalSeoCmsFields
}

export const emptyLeadMagnet = (): LeadMagnetBlock => ({
  headline: '',
  description: '',
  ctaLabel: '',
})

export const emptyServiceCard = (): ServiceCardBlock => ({
  title: '',
  description: '',
  price: '',
  rating: '',
  duration: '',
  warranty: '',
  bookUrl: '',
})

export const emptyTrustBenefit = (): TrustBenefitBlock => ({
  heading: '',
  body: '',
})

export const emptyBookingStep = (): BookingStepBlock => ({
  stepNumber: '',
  title: '',
  description: '',
})

export const emptySparePart = (): SparePartRow => ({
  name: '',
  priceRange: '',
})

export const emptyComparisonRow = (): ComparisonRow => ({
  label: '',
  profixer: '',
  others: '',
})

export const emptyFaq = (): FaqBlock => ({
  question: '',
  answer: '',
})

export const emptyRelatedLink = (): RelatedLinkBlock => ({
  label: '',
  url: '',
})

export const emptyHreflangAlternate = (): HreflangAlternateBlock => ({
  hreflang: '',
  href: '',
})

export const emptyBreadcrumbItem = (): BreadcrumbItemBlock => ({
  name: '',
  url: '',
})

export const emptyAggregateRating = (): AggregateRatingCmsFields => ({
  ratingValue: '',
  reviewCount: '',
})

export const emptyTechnicalSeo = (): TechnicalSeoCmsFields => ({
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageAlt: '',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  twitterCreator: '',
  robotsMeta: '',
  hreflangAlternates: [],
  knowsAbout: [],
  schemaPrimaryType: '',
  enableHowToSchema: false,
  enableBreadcrumbSchema: true,
  breadcrumbItems: [],
  speakableSelectors: [],
  answerEngineSummary: '',
  contentModifiedDate: '',
  aggregateRating: emptyAggregateRating(),
  videoEmbedUrls: [],
  enableWebPageSchema: true,
  enableServiceOfferSchema: true,
})

export const emptyLocalityGuideSection = (): LocalityGuideSectionBlock => ({
  h2: '',
  paragraphs: [''],
})

export const emptyLocalityGuide = (): LocalityGuideCmsFields => ({
  enabled: false,
  expandDetailsByDefault: false,
  articleH2: '',
  leadParagraphs: [],
  sections: [],
  summaryLead: '',
  takeaways: [],
  jsonLdBrandServiceName: '',
  useFaqsForSchema: false,
  showInboundLinkStrip: true,
  showBookingCtaStrip: true,
})

export const emptyLocalSeo = (): LocalSeoCmsFields => ({
  enableLocalBusinessSchema: false,
  localProfileName: '',
  serviceAreaHeadline: '',
  serviceAreaPlaceNames: [],
  serviceAreaNarrative: '',
  localIntentKeywords: [],
  openingHoursSummary: '',
  googleBusinessProfileUrl: '',
  sameAsUrls: [],
  streetAddress: '',
  addressLocality: '',
  addressRegion: '',
  postalCode: '',
  addressCountryCode: '',
  geoLatLng: '',
  priceRange: '',
  ogImageOverride: '',
})

export const emptyServiceTypeBlock = (): ServiceTypeBlock => ({
  title: '',
  description: '',
  bullets: [''],
})

export function emptyCategoryMarketingConfig(): CategoryMarketingConfig {
  return {
    seoTitle: '',
    metaDescription: '',
    urlSlugPattern: '',
    primaryKeyword: '',
    secondaryKeywords: [],
    heroTrustBadge: '',
    heroChip: '',
    heroProofPoints: [],
    topicChips: [],
    mainHeading: '',
    intro: '',
    introLeadMagnetLabel: '',
    introLeadMagnetUrl: '',
    serviceCards: [],
    serviceCardsEyebrow: '',
    serviceCardsHeading: '',
    serviceTypes: [],
    serviceTypesEyebrow: '',
    serviceTypesHeading: '',
    trustBenefits: [],
    trustBenefitsEyebrow: '',
    trustBenefitsHeading: '',
    waysHeading: '',
    waysBullets: [],
    experienceIncluded: [],
    areasList: [],
    areasCta: '',
    areasCopy: '',
    areasEyebrow: '',
    areasHeading: '',
    localityAsideTitle: '',
    localityAsideIntro: '',
    localityAsideBreadcrumbLabel: '',
    bookingSteps: [],
    bookingStepsImage: undefined,
    bookingStepsImageAlt: undefined,
    contactPhone: '',
    contactWhatsapp: '',
    pricingHeading: '',
    spareParts: [],
    pricingIncluded: [],
    pricingExcluded: [],
    comparisonRows: [],
    faqs: [],
    relatedLinks: [],
    closingParagraph: '',
    leadMagnet: emptyLeadMagnet(),
    jsonLdExtra: '',
    localityGuide: emptyLocalityGuide(),
    localSeo: emptyLocalSeo(),
    technicalSeo: emptyTechnicalSeo(),
  }
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? ''))
  if (typeof v === 'string') {
    return v
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeServiceType(raw: unknown): ServiceTypeBlock {
  if (!raw || typeof raw !== 'object') return emptyServiceTypeBlock()
  const o = raw as Record<string, unknown>
  const bullets = asStringArray(o.bullets)
  return {
    title: String(o.title ?? ''),
    description: String(o.description ?? ''),
    bullets: bullets.length ? bullets : [''],
  }
}

function normalizeServiceCard(raw: unknown): ServiceCardBlock {
  if (!raw || typeof raw !== 'object') return emptyServiceCard()
  const o = raw as Record<string, unknown>
  return {
    title: String(o.title ?? ''),
    description: String(o.description ?? ''),
    price: String(o.price ?? ''),
    rating: String(o.rating ?? ''),
    duration: String(o.duration ?? ''),
    warranty: String(o.warranty ?? ''),
    bookUrl: String(o.bookUrl ?? ''),
  }
}

function normalizeTrustBenefit(raw: unknown): TrustBenefitBlock {
  if (!raw || typeof raw !== 'object') return emptyTrustBenefit()
  const o = raw as Record<string, unknown>
  return {
    heading: String(o.heading ?? ''),
    body: String(o.body ?? ''),
  }
}

function normalizeBookingStep(raw: unknown): BookingStepBlock {
  if (!raw || typeof raw !== 'object') return emptyBookingStep()
  const o = raw as Record<string, unknown>
  return {
    stepNumber: String(o.stepNumber ?? ''),
    title: String(o.title ?? ''),
    description: String(o.description ?? ''),
  }
}

function normalizeSparePart(raw: unknown): SparePartRow {
  if (!raw || typeof raw !== 'object') return emptySparePart()
  const o = raw as Record<string, unknown>
  return {
    name: String(o.name ?? ''),
    priceRange: String(o.priceRange ?? o.price ?? ''),
  }
}

function normalizeComparisonRow(raw: unknown): ComparisonRow {
  if (!raw || typeof raw !== 'object') return emptyComparisonRow()
  const o = raw as Record<string, unknown>
  return {
    label: String(o.label ?? ''),
    profixer: String(o.profixer ?? o.proFixer ?? ''),
    others: String(o.others ?? ''),
  }
}

function normalizeFaq(raw: unknown): FaqBlock {
  if (!raw || typeof raw !== 'object') return emptyFaq()
  const o = raw as Record<string, unknown>
  return {
    question: String(o.question ?? ''),
    answer: String(o.answer ?? ''),
  }
}

function normalizeRelatedLink(raw: unknown): RelatedLinkBlock {
  if (!raw || typeof raw !== 'object') return emptyRelatedLink()
  const o = raw as Record<string, unknown>
  return {
    label: String(o.label ?? ''),
    url: String(o.url ?? ''),
  }
}

function normalizeHreflangAlternate(raw: unknown): HreflangAlternateBlock {
  if (!raw || typeof raw !== 'object') return emptyHreflangAlternate()
  const o = raw as Record<string, unknown>
  return {
    hreflang: String(o.hreflang ?? o.lang ?? ''),
    href: String(o.href ?? o.url ?? ''),
  }
}

function normalizeBreadcrumbItem(raw: unknown): BreadcrumbItemBlock {
  if (!raw || typeof raw !== 'object') return emptyBreadcrumbItem()
  const o = raw as Record<string, unknown>
  return {
    name: String(o.name ?? o.label ?? ''),
    url: String(o.url ?? o.href ?? ''),
  }
}

function normalizeAggregateRating(raw: unknown): AggregateRatingCmsFields {
  if (!raw || typeof raw !== 'object') return emptyAggregateRating()
  const o = raw as Record<string, unknown>
  return {
    ratingValue: String(o.ratingValue ?? o.rating ?? ''),
    reviewCount: String(o.reviewCount ?? o.reviewCountTotal ?? ''),
  }
}

function normalizeTechnicalSeo(raw: unknown): TechnicalSeoCmsFields {
  const e = emptyTechnicalSeo()
  if (!raw || typeof raw !== 'object') return e
  const o = raw as Record<string, unknown>
  const card = String(o.twitterCard ?? '').trim()
  let twitterCard: TechnicalSeoCmsFields['twitterCard'] = e.twitterCard
  if (card === 'summary' || card === 'summary_large_image') twitterCard = card
  else if (card === '') twitterCard = e.twitterCard
  const hreflangAlternates = Array.isArray(o.hreflangAlternates)
    ? (o.hreflangAlternates as unknown[]).map(normalizeHreflangAlternate)
    : e.hreflangAlternates
  const breadcrumbItems = Array.isArray(o.breadcrumbItems)
    ? (o.breadcrumbItems as unknown[]).map(normalizeBreadcrumbItem)
    : e.breadcrumbItems
  return {
    canonicalUrl: String(o.canonicalUrl ?? ''),
    ogTitle: String(o.ogTitle ?? ''),
    ogDescription: String(o.ogDescription ?? ''),
    ogImageAlt: String(o.ogImageAlt ?? ''),
    ogType: String(o.ogType ?? e.ogType),
    twitterCard,
    twitterSite: String(o.twitterSite ?? '').replace(/^@/, ''),
    twitterCreator: String(o.twitterCreator ?? '').replace(/^@/, ''),
    robotsMeta: String(o.robotsMeta ?? o.robots ?? ''),
    hreflangAlternates,
    knowsAbout: asStringArray(o.knowsAbout).length ? asStringArray(o.knowsAbout) : e.knowsAbout,
    schemaPrimaryType: String(o.schemaPrimaryType ?? o.schemaType ?? ''),
    enableHowToSchema: Boolean(o.enableHowToSchema),
    enableBreadcrumbSchema: o.enableBreadcrumbSchema !== false,
    breadcrumbItems,
    speakableSelectors: asStringArray(o.speakableSelectors).length
      ? asStringArray(o.speakableSelectors)
      : e.speakableSelectors,
    answerEngineSummary: String(o.answerEngineSummary ?? o.aiSummary ?? ''),
    contentModifiedDate: String(o.contentModifiedDate ?? o.dateModified ?? ''),
    aggregateRating: normalizeAggregateRating(o.aggregateRating),
    videoEmbedUrls: asStringArray(o.videoEmbedUrls).length
      ? asStringArray(o.videoEmbedUrls)
      : e.videoEmbedUrls,
    enableWebPageSchema: o.enableWebPageSchema !== false,
    enableServiceOfferSchema: o.enableServiceOfferSchema !== false,
  }
}

function normalizeLeadMagnet(raw: unknown): LeadMagnetBlock {
  if (!raw || typeof raw !== 'object') return emptyLeadMagnet()
  const o = raw as Record<string, unknown>
  return {
    headline: String(o.headline ?? ''),
    description: String(o.description ?? ''),
    ctaLabel: String(o.ctaLabel ?? ''),
  }
}

function normalizeLocalityGuideSection(raw: unknown): LocalityGuideSectionBlock {
  if (!raw || typeof raw !== 'object') return emptyLocalityGuideSection()
  const o = raw as Record<string, unknown>
  const paras = Array.isArray(o.paragraphs)
    ? (o.paragraphs as unknown[]).map((x) => String(x ?? '').trim()).filter(Boolean)
    : typeof o.body === 'string'
      ? o.body
          .split(/\n\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  return {
    h2: String(o.h2 ?? o.title ?? ''),
    paragraphs: paras.length ? paras : [''],
  }
}

function normalizeLocalSeo(raw: unknown): LocalSeoCmsFields {
  const e = emptyLocalSeo()
  if (!raw || typeof raw !== 'object') return e
  const o = raw as Record<string, unknown>
  return {
    enableLocalBusinessSchema: Boolean(o.enableLocalBusinessSchema),
    localProfileName: String(o.localProfileName ?? ''),
    serviceAreaHeadline: String(o.serviceAreaHeadline ?? ''),
    serviceAreaPlaceNames: asStringArray(o.serviceAreaPlaceNames).length
      ? asStringArray(o.serviceAreaPlaceNames)
      : e.serviceAreaPlaceNames,
    serviceAreaNarrative: String(o.serviceAreaNarrative ?? ''),
    localIntentKeywords: asStringArray(o.localIntentKeywords).length
      ? asStringArray(o.localIntentKeywords)
      : e.localIntentKeywords,
    openingHoursSummary: String(o.openingHoursSummary ?? ''),
    googleBusinessProfileUrl: String(o.googleBusinessProfileUrl ?? o.googleBusinessUrl ?? ''),
    sameAsUrls: asStringArray(o.sameAsUrls).length ? asStringArray(o.sameAsUrls) : e.sameAsUrls,
    streetAddress: String(o.streetAddress ?? ''),
    addressLocality: String(o.addressLocality ?? ''),
    addressRegion: String(o.addressRegion ?? ''),
    postalCode: String(o.postalCode ?? ''),
    addressCountryCode: String(o.addressCountryCode ?? o.countryCode ?? ''),
    geoLatLng: String(o.geoLatLng ?? o.geo ?? ''),
    priceRange: String(o.priceRange ?? ''),
    ogImageOverride: String(o.ogImageOverride ?? o.ogImage ?? ''),
  }
}

function normalizeLocalityGuide(raw: unknown): LocalityGuideCmsFields {
  const e = emptyLocalityGuide()
  if (!raw || typeof raw !== 'object') return e
  const o = raw as Record<string, unknown>
  const sections = Array.isArray(o.sections)
    ? (o.sections as unknown[]).map(normalizeLocalityGuideSection)
    : e.sections
  return {
    enabled: Boolean(o.enabled),
    expandDetailsByDefault: Boolean(o.expandDetailsByDefault),
    articleH2: String(o.articleH2 ?? ''),
    leadParagraphs: asStringArray(o.leadParagraphs).length ? asStringArray(o.leadParagraphs) : e.leadParagraphs,
    sections,
    summaryLead: String(o.summaryLead ?? ''),
    takeaways: asStringArray(o.takeaways).length ? asStringArray(o.takeaways) : e.takeaways,
    jsonLdBrandServiceName: String(o.jsonLdBrandServiceName ?? ''),
    useFaqsForSchema: Boolean(o.useFaqsForSchema),
    showInboundLinkStrip: o.showInboundLinkStrip !== false,
    showBookingCtaStrip: o.showBookingCtaStrip !== false,
  }
}

/**
 * Merge API payload into a full config (backward-compatible with older saved shapes).
 */
export function mergeCategoryConfig(
  partial?: Partial<CategoryMarketingConfig> | Record<string, unknown> | null,
): CategoryMarketingConfig {
  const e = emptyCategoryMarketingConfig()
  if (!partial || typeof partial !== 'object') return e
  const p = partial as Record<string, unknown>

  let secondaryKeywords = e.secondaryKeywords
  if (Array.isArray(p.secondaryKeywords)) {
    secondaryKeywords = (p.secondaryKeywords as unknown[]).map((x) => String(x ?? '')).filter(Boolean)
  } else if (typeof p.secondaryKeywords === 'string') {
    secondaryKeywords = p.secondaryKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return {
    ...e,
    seoTitle: String(p.seoTitle ?? e.seoTitle),
    metaDescription: String(p.metaDescription ?? e.metaDescription),
    urlSlugPattern: String(p.urlSlugPattern ?? e.urlSlugPattern),
    primaryKeyword: String(p.primaryKeyword ?? e.primaryKeyword),
    secondaryKeywords,
    heroTrustBadge: String(p.heroTrustBadge ?? e.heroTrustBadge),
    heroChip: String(p.heroChip ?? e.heroChip),
    heroProofPoints: asStringArray(p.heroProofPoints).length
      ? asStringArray(p.heroProofPoints)
      : e.heroProofPoints,
    topicChips: asStringArray(p.topicChips).length ? asStringArray(p.topicChips) : e.topicChips,
    mainHeading: String(p.mainHeading ?? e.mainHeading),
    intro: String(p.intro ?? e.intro),
    introLeadMagnetLabel: String(p.introLeadMagnetLabel ?? e.introLeadMagnetLabel),
    introLeadMagnetUrl: String(p.introLeadMagnetUrl ?? e.introLeadMagnetUrl),
    image1: p.image1 != null ? String(p.image1) : undefined,
    image2: p.image2 != null ? String(p.image2) : undefined,
    serviceCards: Array.isArray(p.serviceCards)
      ? (p.serviceCards as unknown[]).map(normalizeServiceCard)
      : e.serviceCards,
    serviceCardsEyebrow: String(p.serviceCardsEyebrow ?? e.serviceCardsEyebrow),
    serviceCardsHeading: String(p.serviceCardsHeading ?? e.serviceCardsHeading),
    serviceTypes: Array.isArray(p.serviceTypes)
      ? (p.serviceTypes as unknown[]).map(normalizeServiceType)
      : e.serviceTypes,
    serviceTypesEyebrow: String(p.serviceTypesEyebrow ?? e.serviceTypesEyebrow),
    serviceTypesHeading: String(p.serviceTypesHeading ?? e.serviceTypesHeading),
    trustBenefits: Array.isArray(p.trustBenefits)
      ? (p.trustBenefits as unknown[]).map(normalizeTrustBenefit)
      : e.trustBenefits,
    trustBenefitsEyebrow: String(p.trustBenefitsEyebrow ?? e.trustBenefitsEyebrow),
    trustBenefitsHeading: String(p.trustBenefitsHeading ?? e.trustBenefitsHeading),
    waysHeading: String(p.waysHeading ?? e.waysHeading),
    waysBullets: asStringArray(p.waysBullets).length ? asStringArray(p.waysBullets) : e.waysBullets,
    experienceIncluded: asStringArray(p.experienceIncluded).length
      ? asStringArray(p.experienceIncluded)
      : e.experienceIncluded,
    areasList: asStringArray(p.areasList).length ? asStringArray(p.areasList) : e.areasList,
    areasCta: String(p.areasCta ?? e.areasCta),
    areasCopy: String(p.areasCopy ?? e.areasCopy),
    areasEyebrow: String(p.areasEyebrow ?? e.areasEyebrow),
    areasHeading: String(p.areasHeading ?? e.areasHeading),
    localityAsideTitle: String(p.localityAsideTitle ?? e.localityAsideTitle),
    localityAsideIntro: String(p.localityAsideIntro ?? e.localityAsideIntro),
    localityAsideBreadcrumbLabel: String(
      p.localityAsideBreadcrumbLabel ?? e.localityAsideBreadcrumbLabel,
    ),
    bookingSteps: Array.isArray(p.bookingSteps)
      ? (p.bookingSteps as unknown[]).map(normalizeBookingStep)
      : e.bookingSteps,
    bookingStepsImage: p.bookingStepsImage != null ? String(p.bookingStepsImage) : e.bookingStepsImage,
    bookingStepsImageAlt:
      p.bookingStepsImageAlt != null ? String(p.bookingStepsImageAlt) : e.bookingStepsImageAlt,
    contactPhone: String(p.contactPhone ?? e.contactPhone),
    contactWhatsapp: String(p.contactWhatsapp ?? e.contactWhatsapp),
    pricingHeading: String(p.pricingHeading ?? e.pricingHeading),
    spareParts: Array.isArray(p.spareParts)
      ? (p.spareParts as unknown[]).map(normalizeSparePart)
      : e.spareParts,
    pricingIncluded: asStringArray(p.pricingIncluded).length
      ? asStringArray(p.pricingIncluded)
      : e.pricingIncluded,
    pricingExcluded: asStringArray(p.pricingExcluded).length
      ? asStringArray(p.pricingExcluded)
      : e.pricingExcluded,
    comparisonRows: Array.isArray(p.comparisonRows)
      ? (p.comparisonRows as unknown[]).map(normalizeComparisonRow)
      : e.comparisonRows,
    faqs: Array.isArray(p.faqs) ? (p.faqs as unknown[]).map(normalizeFaq) : e.faqs,
    relatedLinks: Array.isArray(p.relatedLinks)
      ? (p.relatedLinks as unknown[]).map(normalizeRelatedLink)
      : e.relatedLinks,
    closingParagraph: String(p.closingParagraph ?? e.closingParagraph),
    leadMagnet: normalizeLeadMagnet(p.leadMagnet),
    jsonLdExtra: String(p.jsonLdExtra ?? e.jsonLdExtra),
    localityGuide: normalizeLocalityGuide(p.localityGuide),
    localSeo: normalizeLocalSeo(p.localSeo),
    technicalSeo: normalizeTechnicalSeo(p.technicalSeo),
  }
}

export function normalizeCategoryMarketingRecord(
  raw: Record<string, unknown> | null | undefined,
): Record<string, CategoryMarketingConfig> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, CategoryMarketingConfig> = {}
  for (const key of Object.keys(raw)) {
    out[key] = mergeCategoryConfig(raw[key] as Record<string, unknown>)
  }
  return out
}

function nonEmpty(s: string): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

function pickStr(staticVal: string, apiVal: string): string {
  return nonEmpty(apiVal) ? apiVal : staticVal
}

/** Prefer CMS (api) values when set; otherwise keep static fallback (staticBase). */
export function mergePreferApiStatic(
  staticBase: CategoryMarketingConfig,
  api: CategoryMarketingConfig,
): CategoryMarketingConfig {
  const pickArr = <T>(s: T[], a: T[], hasMeaning: (x: T) => boolean) =>
    a.length > 0 && a.some(hasMeaning) ? a : s

  const serviceCards = pickArr(staticBase.serviceCards, api.serviceCards, (c) => nonEmpty(c.title))
  const serviceTypes = pickArr(staticBase.serviceTypes, api.serviceTypes, (t) => nonEmpty(t.title))
  const trustBenefits = pickArr(staticBase.trustBenefits, api.trustBenefits, (b) => nonEmpty(b.heading))
  const waysBullets =
    api.waysBullets.some(nonEmpty) ? api.waysBullets : staticBase.waysBullets
  const experienceIncluded = pickArr(
    staticBase.experienceIncluded,
    api.experienceIncluded,
    nonEmpty,
  )
  const areasList = pickArr(staticBase.areasList, api.areasList, nonEmpty)
  const bookingSteps = pickArr(staticBase.bookingSteps, api.bookingSteps, (s) =>
    nonEmpty(s.title),
  )
  const spareParts = pickArr(staticBase.spareParts, api.spareParts, (p) => nonEmpty(p.name))
  const pricingIncluded = pickArr(staticBase.pricingIncluded, api.pricingIncluded, nonEmpty)
  const pricingExcluded = pickArr(staticBase.pricingExcluded, api.pricingExcluded, nonEmpty)
  const comparisonRows = pickArr(staticBase.comparisonRows, api.comparisonRows, (r) =>
    nonEmpty(r.label),
  )
  const faqs = pickArr(staticBase.faqs, api.faqs, (f) => nonEmpty(f.question))
  const relatedLinks = pickArr(staticBase.relatedLinks, api.relatedLinks, (l) =>
    nonEmpty(l.url),
  )

  const heroProofPoints = pickArr(staticBase.heroProofPoints, api.heroProofPoints, nonEmpty)
  const topicChips = pickArr(staticBase.topicChips, api.topicChips, nonEmpty)

  const lmS = staticBase.leadMagnet
  const lmA = api.leadMagnet
  const leadMagnet = {
    headline: pickStr(lmS.headline, lmA.headline),
    description: pickStr(lmS.description, lmA.description),
    ctaLabel: pickStr(lmS.ctaLabel, lmA.ctaLabel),
  }

  const lgS = staticBase.localityGuide
  const lgA = api.localityGuide ?? emptyLocalityGuide()
  const localityGuide =
    lgA.enabled || lgA.articleH2.trim() || lgA.summaryLead.trim()
      ? { ...lgS, ...lgA, sections: lgA.sections.length > 0 ? lgA.sections : lgS.sections }
      : lgS

  const lsS = staticBase.localSeo
  const lsA = api.localSeo ?? emptyLocalSeo()
  const serviceAreaPlaceNames = pickArr(lsS.serviceAreaPlaceNames, lsA.serviceAreaPlaceNames, nonEmpty)
  const localIntentKeywords = pickArr(lsS.localIntentKeywords, lsA.localIntentKeywords, nonEmpty)
  const sameAsUrls = pickArr(lsS.sameAsUrls, lsA.sameAsUrls, nonEmpty)
  const localSeo: LocalSeoCmsFields = {
    enableLocalBusinessSchema: lsA.enableLocalBusinessSchema || lsS.enableLocalBusinessSchema,
    localProfileName: pickStr(lsS.localProfileName, lsA.localProfileName),
    serviceAreaHeadline: pickStr(lsS.serviceAreaHeadline, lsA.serviceAreaHeadline),
    serviceAreaPlaceNames,
    serviceAreaNarrative: pickStr(lsS.serviceAreaNarrative, lsA.serviceAreaNarrative),
    localIntentKeywords,
    openingHoursSummary: pickStr(lsS.openingHoursSummary, lsA.openingHoursSummary),
    googleBusinessProfileUrl: pickStr(lsS.googleBusinessProfileUrl, lsA.googleBusinessProfileUrl),
    sameAsUrls,
    streetAddress: pickStr(lsS.streetAddress, lsA.streetAddress),
    addressLocality: pickStr(lsS.addressLocality, lsA.addressLocality),
    addressRegion: pickStr(lsS.addressRegion, lsA.addressRegion),
    postalCode: pickStr(lsS.postalCode, lsA.postalCode),
    addressCountryCode: pickStr(lsS.addressCountryCode, lsA.addressCountryCode),
    geoLatLng: pickStr(lsS.geoLatLng, lsA.geoLatLng),
    priceRange: pickStr(lsS.priceRange, lsA.priceRange),
    ogImageOverride: pickStr(lsS.ogImageOverride, lsA.ogImageOverride),
  }

  const tsS = staticBase.technicalSeo
  const tsA = api.technicalSeo ?? emptyTechnicalSeo()
  const knowsAbout = pickArr(tsS.knowsAbout, tsA.knowsAbout, nonEmpty)
  const speakableSelectors = pickArr(tsS.speakableSelectors, tsA.speakableSelectors, nonEmpty)
  const videoEmbedUrls = pickArr(tsS.videoEmbedUrls, tsA.videoEmbedUrls, nonEmpty)
  const hreflangAlternates =
    tsA.hreflangAlternates.length > 0 && tsA.hreflangAlternates.some((h) => nonEmpty(h.href))
      ? tsA.hreflangAlternates
      : tsS.hreflangAlternates
  const breadcrumbItems =
    tsA.breadcrumbItems.length > 0 && tsA.breadcrumbItems.some((b) => nonEmpty(b.url))
      ? tsA.breadcrumbItems
      : tsS.breadcrumbItems
  const arS = tsS.aggregateRating
  const arA = tsA.aggregateRating ?? emptyAggregateRating()
  const aggregateRating: AggregateRatingCmsFields = {
    ratingValue: pickStr(arS.ratingValue, arA.ratingValue),
    reviewCount: pickStr(arS.reviewCount, arA.reviewCount),
  }
  const technicalSeo: TechnicalSeoCmsFields = {
    canonicalUrl: pickStr(tsS.canonicalUrl, tsA.canonicalUrl),
    ogTitle: pickStr(tsS.ogTitle, tsA.ogTitle),
    ogDescription: pickStr(tsS.ogDescription, tsA.ogDescription),
    ogImageAlt: pickStr(tsS.ogImageAlt, tsA.ogImageAlt),
    ogType: pickStr(tsS.ogType, tsA.ogType),
    twitterCard: tsA.twitterCard || tsS.twitterCard,
    twitterSite: pickStr(tsS.twitterSite, tsA.twitterSite),
    twitterCreator: pickStr(tsS.twitterCreator, tsA.twitterCreator),
    robotsMeta: pickStr(tsS.robotsMeta, tsA.robotsMeta),
    hreflangAlternates,
    knowsAbout,
    schemaPrimaryType: pickStr(tsS.schemaPrimaryType, tsA.schemaPrimaryType),
    enableHowToSchema: tsA.enableHowToSchema || tsS.enableHowToSchema,
    enableBreadcrumbSchema: tsA.enableBreadcrumbSchema || tsS.enableBreadcrumbSchema,
    breadcrumbItems,
    speakableSelectors,
    answerEngineSummary: pickStr(tsS.answerEngineSummary, tsA.answerEngineSummary),
    contentModifiedDate: pickStr(tsS.contentModifiedDate, tsA.contentModifiedDate),
    aggregateRating,
    videoEmbedUrls,
    enableWebPageSchema: tsA.enableWebPageSchema || tsS.enableWebPageSchema,
    enableServiceOfferSchema: tsA.enableServiceOfferSchema || tsS.enableServiceOfferSchema,
  }

  return {
    seoTitle: pickStr(staticBase.seoTitle, api.seoTitle),
    metaDescription: pickStr(staticBase.metaDescription, api.metaDescription),
    urlSlugPattern: pickStr(staticBase.urlSlugPattern, api.urlSlugPattern),
    primaryKeyword: pickStr(staticBase.primaryKeyword, api.primaryKeyword),
    secondaryKeywords:
      api.secondaryKeywords.length > 0 ? api.secondaryKeywords : staticBase.secondaryKeywords,
    heroTrustBadge: pickStr(staticBase.heroTrustBadge, api.heroTrustBadge),
    heroChip: pickStr(staticBase.heroChip, api.heroChip),
    heroProofPoints,
    topicChips,
    mainHeading: pickStr(staticBase.mainHeading, api.mainHeading),
    intro: pickStr(staticBase.intro, api.intro),
    introLeadMagnetLabel: pickStr(staticBase.introLeadMagnetLabel, api.introLeadMagnetLabel),
    introLeadMagnetUrl: pickStr(staticBase.introLeadMagnetUrl, api.introLeadMagnetUrl),
    image1: api.image1?.trim() ? api.image1 : staticBase.image1,
    image2: api.image2?.trim() ? api.image2 : staticBase.image2,
    serviceCards,
    serviceCardsEyebrow: pickStr(staticBase.serviceCardsEyebrow, api.serviceCardsEyebrow),
    serviceCardsHeading: pickStr(staticBase.serviceCardsHeading, api.serviceCardsHeading),
    serviceTypes,
    serviceTypesEyebrow: pickStr(staticBase.serviceTypesEyebrow, api.serviceTypesEyebrow),
    serviceTypesHeading: pickStr(staticBase.serviceTypesHeading, api.serviceTypesHeading),
    trustBenefits,
    trustBenefitsEyebrow: pickStr(staticBase.trustBenefitsEyebrow, api.trustBenefitsEyebrow),
    trustBenefitsHeading: pickStr(staticBase.trustBenefitsHeading, api.trustBenefitsHeading),
    waysHeading: pickStr(staticBase.waysHeading, api.waysHeading),
    waysBullets,
    experienceIncluded,
    areasList,
    areasCta: pickStr(staticBase.areasCta, api.areasCta),
    areasCopy: pickStr(staticBase.areasCopy, api.areasCopy),
    areasEyebrow: pickStr(staticBase.areasEyebrow, api.areasEyebrow),
    areasHeading: pickStr(staticBase.areasHeading, api.areasHeading),
    localityAsideTitle: pickStr(staticBase.localityAsideTitle, api.localityAsideTitle),
    localityAsideIntro: pickStr(staticBase.localityAsideIntro, api.localityAsideIntro),
    localityAsideBreadcrumbLabel: pickStr(
      staticBase.localityAsideBreadcrumbLabel,
      api.localityAsideBreadcrumbLabel,
    ),
    bookingSteps,
    bookingStepsImage: api.bookingStepsImage?.trim() ? api.bookingStepsImage : staticBase.bookingStepsImage,
    bookingStepsImageAlt: api.bookingStepsImageAlt?.trim()
      ? api.bookingStepsImageAlt
      : staticBase.bookingStepsImageAlt,
    contactPhone: pickStr(staticBase.contactPhone, api.contactPhone),
    contactWhatsapp: pickStr(staticBase.contactWhatsapp, api.contactWhatsapp),
    pricingHeading: pickStr(staticBase.pricingHeading, api.pricingHeading),
    spareParts,
    pricingIncluded,
    pricingExcluded,
    comparisonRows,
    faqs,
    relatedLinks,
    closingParagraph: pickStr(staticBase.closingParagraph, api.closingParagraph),
    leadMagnet,
    jsonLdExtra: pickStr(staticBase.jsonLdExtra, api.jsonLdExtra),
    localityGuide,
    localSeo,
    technicalSeo,
  }
}

export type ServicePagePlaceholders = {
  city: string
  location: string
  serviceName: string
}

/** Replace [City], [Location], [ServiceName] style tokens from CMS copy. */
export function replaceServicePagePlaceholders(text: string, ctx: ServicePagePlaceholders): string {
  if (!text) return text
  const { city, location, serviceName } = ctx
  return text
    .replace(/\[City\]/gi, city)
    .replace(/\[Location\]/gi, location)
    .replace(/\[ServiceName\]/gi, serviceName)
    .replace(/\[SERVICE\]/gi, serviceName)
}
