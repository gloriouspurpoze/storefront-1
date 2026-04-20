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

export interface CategoryMarketingConfig {
  seoTitle: string
  metaDescription: string
  urlSlugPattern: string
  primaryKeyword: string
  secondaryKeywords: string[]

  mainHeading: string
  intro: string
  introLeadMagnetLabel: string
  introLeadMagnetUrl: string
  image1?: string
  image2?: string

  serviceCards: ServiceCardBlock[]

  serviceTypes: ServiceTypeBlock[]

  trustBenefits: TrustBenefitBlock[]
  waysHeading: string
  waysBullets: string[]

  experienceIncluded: string[]

  areasList: string[]
  areasCta: string
  areasCopy: string

  bookingSteps: BookingStepBlock[]
  contactPhone: string
  contactWhatsapp: string

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
    mainHeading: '',
    intro: '',
    introLeadMagnetLabel: '',
    introLeadMagnetUrl: '',
    serviceCards: [],
    serviceTypes: [],
    trustBenefits: [],
    waysHeading: '',
    waysBullets: [],
    experienceIncluded: [],
    areasList: [],
    areasCta: '',
    areasCopy: '',
    bookingSteps: [],
    contactPhone: '',
    contactWhatsapp: '',
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
    mainHeading: String(p.mainHeading ?? e.mainHeading),
    intro: String(p.intro ?? e.intro),
    introLeadMagnetLabel: String(p.introLeadMagnetLabel ?? e.introLeadMagnetLabel),
    introLeadMagnetUrl: String(p.introLeadMagnetUrl ?? e.introLeadMagnetUrl),
    image1: p.image1 != null ? String(p.image1) : undefined,
    image2: p.image2 != null ? String(p.image2) : undefined,
    serviceCards: Array.isArray(p.serviceCards)
      ? (p.serviceCards as unknown[]).map(normalizeServiceCard)
      : e.serviceCards,
    serviceTypes: Array.isArray(p.serviceTypes)
      ? (p.serviceTypes as unknown[]).map(normalizeServiceType)
      : e.serviceTypes,
    trustBenefits: Array.isArray(p.trustBenefits)
      ? (p.trustBenefits as unknown[]).map(normalizeTrustBenefit)
      : e.trustBenefits,
    waysHeading: String(p.waysHeading ?? e.waysHeading),
    waysBullets: asStringArray(p.waysBullets).length ? asStringArray(p.waysBullets) : e.waysBullets,
    experienceIncluded: asStringArray(p.experienceIncluded).length
      ? asStringArray(p.experienceIncluded)
      : e.experienceIncluded,
    areasList: asStringArray(p.areasList).length ? asStringArray(p.areasList) : e.areasList,
    areasCta: String(p.areasCta ?? e.areasCta),
    areasCopy: String(p.areasCopy ?? e.areasCopy),
    bookingSteps: Array.isArray(p.bookingSteps)
      ? (p.bookingSteps as unknown[]).map(normalizeBookingStep)
      : e.bookingSteps,
    contactPhone: String(p.contactPhone ?? e.contactPhone),
    contactWhatsapp: String(p.contactWhatsapp ?? e.contactWhatsapp),
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

  return {
    seoTitle: pickStr(staticBase.seoTitle, api.seoTitle),
    metaDescription: pickStr(staticBase.metaDescription, api.metaDescription),
    urlSlugPattern: pickStr(staticBase.urlSlugPattern, api.urlSlugPattern),
    primaryKeyword: pickStr(staticBase.primaryKeyword, api.primaryKeyword),
    secondaryKeywords:
      api.secondaryKeywords.length > 0 ? api.secondaryKeywords : staticBase.secondaryKeywords,
    mainHeading: pickStr(staticBase.mainHeading, api.mainHeading),
    intro: pickStr(staticBase.intro, api.intro),
    introLeadMagnetLabel: pickStr(staticBase.introLeadMagnetLabel, api.introLeadMagnetLabel),
    introLeadMagnetUrl: pickStr(staticBase.introLeadMagnetUrl, api.introLeadMagnetUrl),
    image1: api.image1?.trim() ? api.image1 : staticBase.image1,
    image2: api.image2?.trim() ? api.image2 : staticBase.image2,
    serviceCards,
    serviceTypes,
    trustBenefits,
    waysHeading: pickStr(staticBase.waysHeading, api.waysHeading),
    waysBullets,
    experienceIncluded,
    areasList,
    areasCta: pickStr(staticBase.areasCta, api.areasCta),
    areasCopy: pickStr(staticBase.areasCopy, api.areasCopy),
    bookingSteps,
    contactPhone: pickStr(staticBase.contactPhone, api.contactPhone),
    contactWhatsapp: pickStr(staticBase.contactWhatsapp, api.contactWhatsapp),
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
