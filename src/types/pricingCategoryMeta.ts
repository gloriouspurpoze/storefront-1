/**
 * Pricing category meta — editorial narrative + structured comparison data for
 * `/pricing/{categorySlug}` on the consumer site.
 *
 * Mirror of the user-site contract documented in `docs/seo/CMS_PROMPT_PRICING.md`.
 * Keep this type in lockstep with the consumer repo's `PricingCategoryMeta` so the
 * same JSON blob can be saved by admin and consumed by the Next.js site without
 * a shape translation step.
 */

export interface PricingFaqItem {
  question: string
  answer: string
}

/**
 * One row of the rate card. Unlike the legacy `{ name, price }[]` shape used by
 * `RateCardManagement`, this carries an explicit market comparison so the
 * consumer site can render the "ProFixer vs typical local market" table that
 * drives conversion + AI-overview extraction.
 */
export interface PricingRateCardRow {
  /** Sub-service / line-item name, e.g. "Gas refill (1.5 ton split)". */
  service: string
  /** ProFixer-side rate (range string, e.g. "₹2,200–₹2,800"). */
  profixer: string
  /** Typical local-market rate (range string), e.g. "₹2,500–₹4,500". */
  others: string
  /** Optional editor note (renders as caption under the row on the consumer site). */
  note?: string
}

export interface PricingStructuredData {
  /** Schema.org primary type. Default `Service` for pricing pages. */
  schemaPrimaryType?: 'Service' | 'WebPage' | 'PriceSpecification'
  /** Entity hints — combine `categoryDisplay` + locality + sub-services. */
  knowsAbout?: string[]
}

/**
 * The full editorial record. Every prose field is optional so editors can
 * ship incrementally — the consumer site falls back to legacy code copy
 * (`PRICING_CATEGORIES_META`) when a field is empty.
 */
export interface PricingCategoryMetaConfig {
  /** Catalog category slug (e.g. "ac-repair", "electrician"). Storage + lookup key. */
  categorySlug: string

  /** Human-readable category name (e.g. "AC repair"). Used in headings + schema. */
  displayName?: string
  /** Short form (e.g. "AC repair"). Used in nav / breadcrumb chips. */
  shortName?: string

  /** `<title>` override (≤60 chars recommended). */
  metaTitle?: string
  /** Meta description (140–160 chars). */
  metaDescription?: string

  /** Price band — numeric so the consumer site can drive JSON-LD `priceRange`. */
  priceFrom?: number
  priceTo?: number
  /** Currency code (defaults to "INR"). */
  currency?: string

  /** Hero lead paragraph (60–90 words). Opens with the price band. */
  heroIntro?: string
  /**
   * Direct answer paragraph (70–110 words) — lifted verbatim by Google AI
   * Overviews, Perplexity, ChatGPT. Encyclopaedia tone, no marketing voice.
   * Must cite priceFrom–priceTo and at least one rateCardRow by name.
   */
  answerEngineSummary?: string
  /** Interprets the rate card (120–180 words). What pushes a job to the top vs bottom? */
  rateCardCommentary?: string
  /** Seasonal / demand patterns specific to Mumbai (2 paragraphs ~110 words each). */
  mumbaiContext?: string
  /** "Why ProFixer vs local market" prose (100–140 words). */
  comparisonNarrative?: string
  /** Soft CTA paragraph (40–70 words). NOT shouty. */
  callToActionParagraph?: string

  /** 8+ FAQ entries — drives FAQ JSON-LD on the consumer site. */
  faq?: PricingFaqItem[]

  /** Three-column rate rows: service / profixer / others / optional note. */
  rateCardRows?: PricingRateCardRow[]

  /** JSON-LD hints. */
  structuredData?: PricingStructuredData

  /**
   * If false, consumer skips this slug in `/sitemaps/pricing.xml` (the
   * category page may still render — the gate is sitemap visibility only).
   */
  isIndexable?: boolean

  /** Free-form editor note (not rendered on the consumer site). */
  internalNote?: string

  /** Last editor update timestamp (informational; backend may overwrite). */
  updatedAt?: string
}
