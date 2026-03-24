/**
 * Industry-level service page / catalog marketing config per CMS catalog category key.
 * Stored via PUT /cms/admin/static-content/category-marketing (opaque JSON per category).
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
