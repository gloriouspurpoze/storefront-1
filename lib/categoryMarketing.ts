/**
 * Storefront consumer for CMS `category-marketing` static content.
 * Keys match tenant product/service category slugs (e.g. `beverages`).
 */

export interface CategoryMarketingFaq {
  question: string
  answer: string
}

export interface CategoryMarketingServiceCard {
  title: string
  description: string
  price: string
  rating: string
  duration: string
  warranty: string
  bookUrl: string
}

export interface CategoryMarketingServiceType {
  title: string
  description: string
  bullets: string[]
}

export interface CategoryMarketingTrustBenefit {
  heading: string
  body: string
}

export interface CategoryMarketingConfig {
  seoTitle: string
  metaDescription: string
  heroTrustBadge: string
  heroChip: string
  heroProofPoints: string[]
  topicChips: string[]
  mainHeading: string
  intro: string
  image1?: string
  image2?: string
  serviceCards: CategoryMarketingServiceCard[]
  serviceCardsEyebrow: string
  serviceCardsHeading: string
  serviceTypes: CategoryMarketingServiceType[]
  serviceTypesEyebrow: string
  serviceTypesHeading: string
  trustBenefits: CategoryMarketingTrustBenefit[]
  trustBenefitsEyebrow: string
  trustBenefitsHeading: string
  spareParts: Array<{ name: string; priceRange: string }>
  pricingHeading: string
  faqs: CategoryMarketingFaq[]
  closingParagraph: string
  relatedLinks: Array<{ label: string; url: string }>
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '')).filter((s) => s.trim())
  if (typeof v === 'string') {
    return v
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function emptyCategoryMarketingConfig(): CategoryMarketingConfig {
  return {
    seoTitle: '',
    metaDescription: '',
    heroTrustBadge: '',
    heroChip: '',
    heroProofPoints: [],
    topicChips: [],
    mainHeading: '',
    intro: '',
    serviceCards: [],
    serviceCardsEyebrow: '',
    serviceCardsHeading: '',
    serviceTypes: [],
    serviceTypesEyebrow: '',
    serviceTypesHeading: '',
    trustBenefits: [],
    trustBenefitsEyebrow: '',
    trustBenefitsHeading: '',
    spareParts: [],
    pricingHeading: '',
    faqs: [],
    closingParagraph: '',
    relatedLinks: [],
  }
}

export function mergeCategoryMarketingConfig(
  partial?: Record<string, unknown> | null,
): CategoryMarketingConfig {
  const e = emptyCategoryMarketingConfig()
  if (!partial || typeof partial !== 'object') return e
  const p = partial

  return {
    ...e,
    seoTitle: String(p.seoTitle ?? e.seoTitle),
    metaDescription: String(p.metaDescription ?? e.metaDescription),
    heroTrustBadge: String(p.heroTrustBadge ?? e.heroTrustBadge),
    heroChip: String(p.heroChip ?? e.heroChip),
    heroProofPoints: asStringArray(p.heroProofPoints),
    topicChips: asStringArray(p.topicChips),
    mainHeading: String(p.mainHeading ?? e.mainHeading),
    intro: String(p.intro ?? e.intro),
    image1: p.image1 != null ? String(p.image1) : undefined,
    image2: p.image2 != null ? String(p.image2) : undefined,
    serviceCardsEyebrow: String(p.serviceCardsEyebrow ?? e.serviceCardsEyebrow),
    serviceCardsHeading: String(p.serviceCardsHeading ?? e.serviceCardsHeading),
    serviceTypesEyebrow: String(p.serviceTypesEyebrow ?? e.serviceTypesEyebrow),
    serviceTypesHeading: String(p.serviceTypesHeading ?? e.serviceTypesHeading),
    trustBenefitsEyebrow: String(p.trustBenefitsEyebrow ?? e.trustBenefitsEyebrow),
    trustBenefitsHeading: String(p.trustBenefitsHeading ?? e.trustBenefitsHeading),
    pricingHeading: String(p.pricingHeading ?? e.pricingHeading),
    closingParagraph: String(p.closingParagraph ?? e.closingParagraph),
    serviceCards: Array.isArray(p.serviceCards)
      ? (p.serviceCards as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            title: String(o.title ?? ''),
            description: String(o.description ?? ''),
            price: String(o.price ?? ''),
            rating: String(o.rating ?? ''),
            duration: String(o.duration ?? ''),
            warranty: String(o.warranty ?? ''),
            bookUrl: String(o.bookUrl ?? ''),
          }
        })
      : e.serviceCards,
    serviceTypes: Array.isArray(p.serviceTypes)
      ? (p.serviceTypes as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            title: String(o.title ?? ''),
            description: String(o.description ?? ''),
            bullets: asStringArray(o.bullets),
          }
        })
      : e.serviceTypes,
    trustBenefits: Array.isArray(p.trustBenefits)
      ? (p.trustBenefits as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            heading: String(o.heading ?? ''),
            body: String(o.body ?? ''),
          }
        })
      : e.trustBenefits,
    spareParts: Array.isArray(p.spareParts)
      ? (p.spareParts as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            name: String(o.name ?? ''),
            priceRange: String(o.priceRange ?? ''),
          }
        })
      : e.spareParts,
    faqs: Array.isArray(p.faqs)
      ? (p.faqs as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            question: String(o.question ?? ''),
            answer: String(o.answer ?? ''),
          }
        })
      : e.faqs,
    relatedLinks: Array.isArray(p.relatedLinks)
      ? (p.relatedLinks as unknown[]).map((raw) => {
          const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
          return {
            label: String(o.label ?? ''),
            url: String(o.url ?? ''),
          }
        })
      : e.relatedLinks,
  }
}

export function normalizeCategoryMarketingRecord(
  raw: Record<string, unknown> | null | undefined,
): Record<string, CategoryMarketingConfig> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, CategoryMarketingConfig> = {}
  for (const key of Object.keys(raw)) {
    const slice = raw[key]
    if (slice && typeof slice === 'object' && !Array.isArray(slice)) {
      out[key] = mergeCategoryMarketingConfig(slice as Record<string, unknown>)
    }
  }
  return out
}

export function categoryMarketingForSlug(
  record: Record<string, CategoryMarketingConfig>,
  slug: string,
): CategoryMarketingConfig | null {
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const cfg = record[key]
  return cfg && hasVisibleCategoryMarketing(cfg) ? cfg : null
}

export function hasVisibleCategoryMarketing(cfg: CategoryMarketingConfig): boolean {
  if (cfg.mainHeading.trim() || cfg.intro.trim() || cfg.heroTrustBadge.trim() || cfg.heroChip.trim()) {
    return true
  }
  if (cfg.serviceCards.some((c) => c.title.trim())) return true
  if (cfg.serviceTypes.some((s) => s.title.trim())) return true
  if (cfg.trustBenefits.some((t) => t.heading.trim())) return true
  if (cfg.faqs.some((f) => f.question.trim())) return true
  if (cfg.closingParagraph.trim()) return true
  if (cfg.spareParts.some((p) => p.name.trim())) return true
  if (cfg.image1?.trim() || cfg.image2?.trim()) return true
  return false
}
