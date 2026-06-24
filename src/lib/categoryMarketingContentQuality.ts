/**
 * Page health + length guardrails for Category Marketing CMS (`/cms/category-marketing`).
 */
import {
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
} from '../components/blog/blog-seo-guidelines'
import type { CategoryMarketingConfig } from '../types/categoryMarketing'
import { detectSeoTitleIssue } from './seoTitleQuality'
import {
  evaluateLength,
  stripHtmlPlain,
  countPlainWords,
  type LengthRule,
  type LengthWarning,
} from './seoLandingContentLengthRules'

export type CategoryMarketingTabKey =
  | 'metadata'
  | 'localSeo'
  | 'hero'
  | 'cards'
  | 'detailed'
  | 'trust'
  | 'areas'
  | 'pricing'
  | 'faqs'
  | 'localityGuide'
  | 'closing'

export type CategoryMarketingQualityItem = {
  id: string
  group: 'Metadata' | 'Hero' | 'Content' | 'Local' | 'Links & FAQs' | 'Technical'
  label: string
  ok: boolean
  detail: string
  priority: 'required' | 'recommended'
  tab: CategoryMarketingTabKey
}

export type CategoryMarketingQualityReport = {
  score: number
  statusLabel: 'Not started' | 'Draft' | 'Needs work' | 'Nearly ready' | 'Publish ready'
  statusVariant: 'secondary' | 'warning' | 'info' | 'success'
  items: CategoryMarketingQualityItem[]
  passed: number
  total: number
  requiredPassed: number
  requiredTotal: number
  wordCountEstimate: number
}

export const CATEGORY_MARKETING_LENGTH = {
  pageH1: { unit: 'chars', min: 15, optimalMin: 25, optimalMax: 70, max: 80 } satisfies LengthRule,
  intro: { unit: 'words', min: 60, optimalMin: 100, optimalMax: 350, max: 500 } satisfies LengthRule,
  heroBadge: { unit: 'chars', min: 8, optimalMax: 70, max: 90 } satisfies LengthRule,
  heroChip: { unit: 'chars', min: 8, optimalMax: 80, max: 100 } satisfies LengthRule,
  heroProofPoint: { unit: 'chars', min: 12, optimalMax: 100, max: 140 } satisfies LengthRule,
  heroProofCount: { unit: 'count', min: 3, optimalMax: 3, max: 5 } satisfies LengthRule,
  topicChip: { unit: 'chars', min: 4, optimalMax: 45, max: 60 } satisfies LengthRule,
  serviceCardDesc: { unit: 'chars', min: 40, optimalMin: 60, optimalMax: 200, max: 280 } satisfies LengthRule,
  serviceCardCount: { unit: 'count', min: 3, optimalMax: 6, max: 10 } satisfies LengthRule,
  serviceTypeDesc: { unit: 'words', min: 25, optimalMin: 40, optimalMax: 120, max: 180 } satisfies LengthRule,
  trustBody: { unit: 'chars', min: 60, optimalMin: 100, optimalMax: 350, max: 450 } satisfies LengthRule,
  areasCopy: { unit: 'words', min: 40, optimalMin: 80, optimalMax: 250, max: 400 } satisfies LengthRule,
  faqQuestion: { unit: 'chars', min: 10, optimalMin: 20, optimalMax: 100, max: 120 } satisfies LengthRule,
  faqAnswer: { unit: 'chars', min: 80, optimalMin: 120, optimalMax: 380, max: 500 } satisfies LengthRule,
  faqCount: { unit: 'count', min: 3, optimalMax: 8, max: 12 } satisfies LengthRule,
  relatedLinks: { unit: 'count', min: 3, optimalMax: 8, max: 15 } satisfies LengthRule,
  answerSummary: { unit: 'chars', min: 40, optimalMin: 80, optimalMax: 280, max: 320 } satisfies LengthRule,
  localitySection: { unit: 'words', min: 80, optimalMin: 120, optimalMax: 400, max: 550 } satisfies LengthRule,
  closing: { unit: 'words', min: 40, optimalMin: 60, optimalMax: 180, max: 250 } satisfies LengthRule,
  nearMeTitle: { unit: 'chars', min: 25, optimalMin: 45, optimalMax: 60, max: 70 } satisfies LengthRule,
  nearMeDesc: { unit: 'chars', min: 120, optimalMin: 140, optimalMax: 158, max: 160 } satisfies LengthRule,
  metaTitle: { unit: 'chars', min: SEO_TITLE_MIN_CHARS, optimalMin: 45, optimalMax: SEO_TITLE_OPTIMAL_MAX_CHARS, max: 70 } satisfies LengthRule,
  metaDescription: { unit: 'chars', min: META_DESC_MIN_CHARS, optimalMin: 140, optimalMax: META_DESC_OPTIMAL_MAX_CHARS, max: 160 } satisfies LengthRule,
} as const

export type CategoryMarketingQualityContext = {
  isLocalKey: boolean
  industryLabel: string
  localityDisplayLabel: string
  effectiveKey: string
}

function item(
  partial: Omit<CategoryMarketingQualityItem, 'ok'> & { ok: boolean },
): CategoryMarketingQualityItem {
  return partial
}

function countFilledFaqs(config: CategoryMarketingConfig): number {
  return config.faqs.filter((f) => f.question.trim() && f.answer.trim()).length
}

function countRelatedLinks(config: CategoryMarketingConfig): number {
  return config.relatedLinks.filter((l) => l.label.trim() && l.url.trim()).length
}

function estimateWordCount(config: CategoryMarketingConfig): number {
  const chunks: string[] = [
    config.seoTitle,
    config.metaDescription,
    config.mainHeading,
    stripHtmlPlain(config.intro),
    config.areasCopy,
    stripHtmlPlain(config.closingParagraph),
    config.technicalSeo.answerEngineSummary,
    ...config.heroProofPoints,
    ...config.topicChips,
    ...config.waysBullets,
    ...config.experienceIncluded,
    ...config.pricingIncluded,
    ...config.pricingExcluded,
  ]
  for (const c of config.serviceCards) {
    chunks.push(c.title, c.description)
  }
  for (const t of config.serviceTypes) {
    chunks.push(t.title, t.description, ...t.bullets)
  }
  for (const b of config.trustBenefits) {
    chunks.push(b.heading, b.body)
  }
  for (const f of config.faqs) {
    chunks.push(f.question, stripHtmlPlain(f.answer))
  }
  for (const s of config.localityGuide.sections) {
    chunks.push(s.h2, ...s.paragraphs)
  }
  return chunks.reduce((sum, c) => sum + countPlainWords(c), 0)
}

export function buildCategoryMarketingQualityReport(
  config: CategoryMarketingConfig,
  ctx: CategoryMarketingQualityContext,
): CategoryMarketingQualityReport {
  const items: CategoryMarketingQualityItem[] = []
  const faqCount = countFilledFaqs(config)
  const linkCount = countRelatedLinks(config)
  const cardCount = config.serviceCards.filter((c) => c.title.trim()).length
  const typeCount = config.serviceTypes.filter((t) => t.title.trim()).length
  const trustCount = config.trustBenefits.filter((b) => b.heading.trim() && b.body.trim()).length
  const bookingCount = config.bookingSteps.filter((s) => s.title.trim()).length
  const areasCount = config.areasList.filter(Boolean).length
  const introWords = countPlainWords(config.intro)

  const titleLen = config.seoTitle.trim().length
  items.push(
    item({
      id: 'seo-title',
      group: 'Metadata',
      label: 'SEO title',
      ok: titleLen >= SEO_TITLE_MIN_CHARS && titleLen <= SEO_TITLE_OPTIMAL_MAX_CHARS,
      detail:
        titleLen === 0
          ? 'Add a SERP title with offer + area'
          : titleLen < SEO_TITLE_MIN_CHARS
            ? `${titleLen}/${SEO_TITLE_MIN_CHARS} chars minimum`
            : titleLen > SEO_TITLE_OPTIMAL_MAX_CHARS
              ? `${titleLen} chars — may truncate (aim ≤${SEO_TITLE_OPTIMAL_MAX_CHARS})`
              : `${titleLen} chars — good band`,
      priority: 'required',
      tab: 'metadata',
    }),
  )

  if (titleLen > 0) {
    const issue = detectSeoTitleIssue(config.seoTitle, {
      city: ctx.isLocalKey ? ctx.localityDisplayLabel : '',
      location: ctx.isLocalKey ? ctx.localityDisplayLabel : '',
      serviceName: ctx.industryLabel,
    })
    items.push(
      item({
        id: 'seo-title-structure',
        group: 'Metadata',
        label: 'SEO title tokens',
        ok: !issue,
        detail: issue?.detail ?? 'Title resolves correctly for this key',
        priority: 'required',
        tab: 'metadata',
      }),
    )
  }

  const metaLen = config.metaDescription.trim().length
  items.push(
    item({
      id: 'meta-desc',
      group: 'Metadata',
      label: 'Meta description',
      ok: metaLen >= META_DESC_MIN_CHARS && metaLen <= META_DESC_OPTIMAL_MAX_CHARS,
      detail:
        metaLen === 0
          ? 'Add benefit-led snippet copy'
          : metaLen < META_DESC_MIN_CHARS
            ? `${metaLen}/${META_DESC_MIN_CHARS} chars minimum`
            : metaLen > META_DESC_OPTIMAL_MAX_CHARS
              ? `${metaLen} chars — trim to ≤${META_DESC_OPTIMAL_MAX_CHARS}`
              : `${metaLen} chars — good band`,
      priority: 'required',
      tab: 'metadata',
    }),
    item({
      id: 'primary-kw',
      group: 'Metadata',
      label: 'Primary keyword',
      ok: Boolean(config.primaryKeyword.trim()),
      detail: config.primaryKeyword.trim() || 'Set head term for H1 + intro alignment',
      priority: 'required',
      tab: 'metadata',
    }),
  )

  if (ctx.isLocalKey) {
    const can = config.technicalSeo.canonicalUrl.trim()
    items.push(
      item({
        id: 'canonical',
        group: 'Metadata',
        label: 'Canonical URL',
        ok: /^https?:\/\//i.test(can),
        detail: can ? 'Absolute canonical set' : 'Hyperlocal keys need absolute canonical',
        priority: 'required',
        tab: 'metadata',
      }),
    )
  }

  items.push(
    item({
      id: 'h1',
      group: 'Hero',
      label: 'Page H1 (main heading)',
      ok: config.mainHeading.trim().length >= 15,
      detail: config.mainHeading.trim() ? `${config.mainHeading.trim().length} chars` : 'Add H1 on Hero tab',
      priority: 'required',
      tab: 'hero',
    }),
    item({
      id: 'intro',
      group: 'Hero',
      label: 'Hero intro',
      ok: introWords >= 60,
      detail:
        introWords >= 100
          ? `${introWords} words`
          : `${introWords}/60 words minimum for service landing depth`,
      priority: 'required',
      tab: 'hero',
    }),
    item({
      id: 'hero-proof',
      group: 'Hero',
      label: 'Hero proof points',
      ok: config.heroProofPoints.filter((p) => p.trim()).length >= 3,
      detail: `${config.heroProofPoints.filter((p) => p.trim()).length}/3 proof points`,
      priority: 'recommended',
      tab: 'hero',
    }),
    item({
      id: 'service-cards',
      group: 'Content',
      label: 'Service cards',
      ok: cardCount >= 3,
      detail: `${cardCount}/3+ bookable cards`,
      priority: 'required',
      tab: 'cards',
    }),
    item({
      id: 'service-types',
      group: 'Content',
      label: 'Detailed service options',
      ok: typeCount >= 2,
      detail: `${typeCount}/2+ detailed blocks`,
      priority: 'recommended',
      tab: 'detailed',
    }),
    item({
      id: 'trust',
      group: 'Content',
      label: 'Trust benefits',
      ok: trustCount >= 3,
      detail: `${trustCount}/3+ trust blocks`,
      priority: 'recommended',
      tab: 'trust',
    }),
    item({
      id: 'areas',
      group: 'Content',
      label: 'Areas list',
      ok: areasCount >= 3 || !ctx.isLocalKey,
      detail: ctx.isLocalKey ? `${areasCount}/3+ neighborhoods` : `${areasCount} areas (optional for template)`,
      priority: ctx.isLocalKey ? 'required' : 'recommended',
      tab: 'areas',
    }),
    item({
      id: 'booking',
      group: 'Content',
      label: 'Booking steps',
      ok: bookingCount >= 3,
      detail: `${bookingCount}/3+ HowTo steps`,
      priority: 'recommended',
      tab: 'areas',
    }),
    item({
      id: 'faqs',
      group: 'Links & FAQs',
      label: 'FAQs',
      ok: faqCount >= 3,
      detail: `${faqCount}/3+ complete Q&As`,
      priority: 'required',
      tab: 'faqs',
    }),
    item({
      id: 'links',
      group: 'Links & FAQs',
      label: 'Related links',
      ok: linkCount >= 3,
      detail: `${linkCount}/3+ internal links`,
      priority: 'recommended',
      tab: 'faqs',
    }),
    item({
      id: 'answer-summary',
      group: 'Technical',
      label: 'Answer-engine summary',
      ok: config.technicalSeo.answerEngineSummary.trim().length >= 40,
      detail: `${config.technicalSeo.answerEngineSummary.trim().length}/40 chars minimum`,
      priority: 'required',
      tab: 'metadata',
    }),
  )

  if (ctx.isLocalKey && config.localityGuide.enabled) {
    const sections = config.localityGuide.sections.filter((s) => s.h2.trim())
    items.push(
      item({
        id: 'locality-guide',
        group: 'Local',
        label: 'Locality guide sections',
        ok: sections.length >= 2,
        detail: `${sections.length}/2+ H2 sections`,
        priority: 'recommended',
        tab: 'localityGuide',
      }),
    )
  }

  if (config.localSeo.enableLocalBusinessSchema) {
    const napOk = Boolean(
      config.localSeo.streetAddress.trim() &&
        config.localSeo.addressLocality.trim() &&
        config.localSeo.postalCode.trim(),
    )
    items.push(
      item({
        id: 'nap',
        group: 'Local',
        label: 'NAP (LocalBusiness schema)',
        ok: napOk,
        detail: napOk ? 'Core address fields set' : 'Fill street, locality, PIN when schema is on',
        priority: 'required',
        tab: 'localSeo',
      }),
    )
  }

  const passed = items.filter((i) => i.ok).length
  const total = items.length
  const requiredItems = items.filter((i) => i.priority === 'required')
  const requiredPassed = requiredItems.filter((i) => i.ok).length
  const requiredTotal = requiredItems.length
  const recommendedItems = items.filter((i) => i.priority === 'recommended')
  const recommendedPassed = recommendedItems.filter((i) => i.ok).length
  const recommendedScore =
    recommendedItems.length > 0 ? (recommendedPassed / recommendedItems.length) * 100 : 100
  const requiredScore = requiredTotal > 0 ? (requiredPassed / requiredTotal) * 100 : 0
  const score = Math.round(requiredScore * 0.7 + recommendedScore * 0.3)
  const wordCountEstimate = estimateWordCount(config)

  let statusLabel: CategoryMarketingQualityReport['statusLabel'] = 'Draft'
  let statusVariant: CategoryMarketingQualityReport['statusVariant'] = 'secondary'
  if (passed === 0) {
    statusLabel = 'Not started'
  } else if (requiredPassed < requiredTotal) {
    statusLabel = 'Needs work'
    statusVariant = 'warning'
  } else if (score >= 88) {
    statusLabel = 'Publish ready'
    statusVariant = 'success'
  } else if (score >= 65) {
    statusLabel = 'Nearly ready'
    statusVariant = 'info'
  } else {
    statusLabel = 'Needs work'
    statusVariant = 'warning'
  }

  return {
    score,
    statusLabel,
    statusVariant,
    items,
    passed,
    total,
    requiredPassed,
    requiredTotal,
    wordCountEstimate,
  }
}

export function analyzeCategoryMarketingLengthWarnings(
  config: CategoryMarketingConfig,
  ctx: CategoryMarketingQualityContext,
): LengthWarning[] {
  const warnings: LengthWarning[] = []
  const push = (w: LengthWarning | null) => {
    if (w && w.severity !== 'ok') warnings.push(w)
  }

  push(
    evaluateLength('cm-seo-title', 'SEO title', config.seoTitle, CATEGORY_MARKETING_LENGTH.metaTitle, 'metadata'),
  )
  push(
    evaluateLength(
      'cm-meta-desc',
      'Meta description',
      config.metaDescription,
      CATEGORY_MARKETING_LENGTH.metaDescription,
      'metadata',
    ),
  )
  push(
    evaluateLength(
      'cm-answer-summary',
      'Answer-engine summary',
      config.technicalSeo.answerEngineSummary,
      CATEGORY_MARKETING_LENGTH.answerSummary,
      'metadata',
    ),
  )
  push(evaluateLength('cm-h1', 'Page H1', config.mainHeading, CATEGORY_MARKETING_LENGTH.pageH1, 'hero'))
  push(evaluateLength('cm-intro', 'Hero intro', config.intro, CATEGORY_MARKETING_LENGTH.intro, 'hero'))

  if (config.heroTrustBadge.trim()) {
    push(
      evaluateLength('cm-hero-badge', 'Hero trust badge', config.heroTrustBadge, CATEGORY_MARKETING_LENGTH.heroBadge, 'hero'),
    )
  }
  if (config.heroChip.trim()) {
    push(evaluateLength('cm-hero-chip', 'Hero chip', config.heroChip, CATEGORY_MARKETING_LENGTH.heroChip, 'hero'))
  }

  const proofs = config.heroProofPoints.filter((p) => p.trim())
  push(
    evaluateLength('cm-hero-proof-count', 'Hero proof points', proofs.length, CATEGORY_MARKETING_LENGTH.heroProofCount, 'hero'),
  )
  proofs.forEach((p, i) => {
    push(
      evaluateLength(`cm-hero-proof-${i}`, `Proof point ${i + 1}`, p, CATEGORY_MARKETING_LENGTH.heroProofPoint, 'hero'),
    )
  })

  config.topicChips.filter((c) => c.trim()).forEach((c, i) => {
    push(evaluateLength(`cm-chip-${i}`, `Topic chip ${i + 1}`, c, CATEGORY_MARKETING_LENGTH.topicChip, 'hero'))
  })

  config.serviceCards.forEach((card, i) => {
    if (!card.title.trim() && !card.description.trim()) return
    push(
      evaluateLength(
        `cm-card-desc-${i}`,
        `Service card ${i + 1} description`,
        card.description,
        CATEGORY_MARKETING_LENGTH.serviceCardDesc,
        'cards',
      ),
    )
  })
  push(
    evaluateLength(
      'cm-card-count',
      'Service cards',
      config.serviceCards.filter((c) => c.title.trim()).length,
      CATEGORY_MARKETING_LENGTH.serviceCardCount,
      'cards',
    ),
  )

  config.serviceTypes.forEach((t, i) => {
    if (!t.title.trim() && !t.description.trim()) return
    push(
      evaluateLength(
        `cm-type-desc-${i}`,
        `Service option ${i + 1}`,
        t.description,
        CATEGORY_MARKETING_LENGTH.serviceTypeDesc,
        'detailed',
      ),
    )
  })

  config.trustBenefits.forEach((b, i) => {
    if (!b.body.trim()) return
    push(
      evaluateLength(`cm-trust-${i}`, `Trust benefit ${i + 1}`, b.body, CATEGORY_MARKETING_LENGTH.trustBody, 'trust'),
    )
  })

  if (config.areasCopy.trim()) {
    push(
      evaluateLength('cm-areas-copy', 'Areas copy', config.areasCopy, CATEGORY_MARKETING_LENGTH.areasCopy, 'areas'),
    )
  }

  config.faqs.forEach((f, i) => {
    if (!f.question.trim() && !f.answer.trim()) return
    push(
      evaluateLength(`cm-faq-q-${i}`, `FAQ ${i + 1} question`, f.question, CATEGORY_MARKETING_LENGTH.faqQuestion, 'faqs'),
    )
    push(
      evaluateLength(`cm-faq-a-${i}`, `FAQ ${i + 1} answer`, f.answer, CATEGORY_MARKETING_LENGTH.faqAnswer, 'faqs'),
    )
  })
  push(
    evaluateLength('cm-faq-count', 'FAQ count', countFilledFaqs(config), CATEGORY_MARKETING_LENGTH.faqCount, 'faqs'),
  )
  push(
    evaluateLength(
      'cm-links-count',
      'Related links',
      countRelatedLinks(config),
      CATEGORY_MARKETING_LENGTH.relatedLinks,
      'faqs',
    ),
  )

  config.localityGuide.sections.forEach((sec, i) => {
    const text = [sec.h2, ...sec.paragraphs].join(' ')
    if (!text.trim()) return
    push(
      evaluateLength(
        `cm-loc-sec-${i}`,
        `Locality section ${i + 1}`,
        text,
        CATEGORY_MARKETING_LENGTH.localitySection,
        'localityGuide',
      ),
    )
  })

  if (config.closingParagraph.trim()) {
    push(
      evaluateLength('cm-closing', 'Closing paragraph', config.closingParagraph, CATEGORY_MARKETING_LENGTH.closing, 'closing'),
    )
  }

  if (config.nearMeSeo.title.trim()) {
    push(
      evaluateLength('cm-nearme-title', 'Near-me title', config.nearMeSeo.title, CATEGORY_MARKETING_LENGTH.nearMeTitle, 'localSeo'),
    )
  }
  if (config.nearMeSeo.description.trim()) {
    push(
      evaluateLength(
        'cm-nearme-desc',
        'Near-me description',
        config.nearMeSeo.description,
        CATEGORY_MARKETING_LENGTH.nearMeDesc,
        'localSeo',
      ),
    )
  }

  void ctx
  return warnings
}

export function lengthWarningsNeedAttention(warnings: LengthWarning[]): LengthWarning[] {
  return warnings.filter((w) => w.severity === 'short' || w.severity === 'long' || w.severity === 'empty')
}
