/**
 * Editorial length guardrails for programmatic SEO landing pages.
 * Heuristics for readability, SERP display, and thin/ bloated content — not ranking factors.
 */
import type { ContentSection } from '../types/seoLandingSections'
import type { SeoLandingEntityKind } from './seoLandingPageKinds'

export type LengthUnit = 'chars' | 'words' | 'count'

export type LengthRule = {
  unit: LengthUnit
  min?: number
  optimalMin?: number
  optimalMax?: number
  max?: number
}

export type LengthSeverity = 'empty' | 'short' | 'long' | 'ok'

export type LengthWarning = {
  id: string
  label: string
  severity: LengthSeverity
  message: string
  value: number
  unit: LengthUnit
  /** Editor tab for click-through navigation (page-specific). */
  tab?: string
}

export const SEO_LANDING_LENGTH_RULES = {
  quickAnswer: { unit: 'chars', min: 40, optimalMin: 80, optimalMax: 280, max: 320 },
  pageTitle: { unit: 'chars', min: 10, optimalMin: 25, optimalMax: 70, max: 80 },
  subtitle: { unit: 'chars', optimalMax: 120, max: 160 },
  metaTitle: { unit: 'chars', min: 25, optimalMin: 45, optimalMax: 60, max: 70 },
  metaDescription: { unit: 'chars', min: 120, optimalMin: 140, optimalMax: 158, max: 160 },
  takeawayCount: { unit: 'count', min: 3, optimalMax: 7, max: 8 },
  takeawayItem: { unit: 'chars', min: 20, optimalMin: 40, optimalMax: 160, max: 200 },
  sectionHeading: { unit: 'chars', optimalMax: 80, max: 100 },
  richTextSection: { unit: 'words', min: 80, optimalMin: 150, optimalMax: 450, max: 650 },
  callout: { unit: 'chars', min: 40, optimalMin: 60, optimalMax: 280, max: 400 },
  faqBlockCount: { unit: 'count', min: 3, optimalMax: 8, max: 12 },
  faqQuestion: { unit: 'chars', min: 10, optimalMin: 20, optimalMax: 100, max: 120 },
  faqAnswer: { unit: 'chars', min: 80, optimalMin: 120, optimalMax: 380, max: 500 },
  howToStepCount: { unit: 'count', min: 3, optimalMax: 8, max: 12 },
  howToStepName: { unit: 'chars', min: 5, optimalMin: 10, optimalMax: 70, max: 90 },
  howToStepText: { unit: 'chars', min: 40, optimalMin: 80, optimalMax: 400, max: 550 },
  causesRowCount: { unit: 'count', min: 2, optimalMin: 3, optimalMax: 8, max: 12 },
  causeFixField: { unit: 'chars', min: 8, optimalMin: 15, optimalMax: 100, max: 140 },
  priceTableRows: { unit: 'count', min: 3, optimalMin: 4, optimalMax: 12, max: 18 },
  cardTitle: { unit: 'chars', min: 3, optimalMax: 55, max: 70 },
  cardDescription: { unit: 'chars', optimalMax: 180, max: 240 },
  providerBio: { unit: 'words', min: 80, optimalMin: 120, optimalMax: 350, max: 500 },
  keyTakeawayBullets: { unit: 'count', min: 3, optimalMax: 7, max: 8 },
} as const satisfies Record<string, LengthRule>

export function stripHtmlPlain(s?: string): string {
  return (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function countPlainWords(text: string): number {
  const t = stripHtmlPlain(text)
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

function formatBand(rule: LengthRule): string {
  const parts: string[] = []
  if (rule.optimalMin != null && rule.optimalMax != null) {
    parts.push(`${rule.optimalMin}–${rule.optimalMax}`)
  } else if (rule.min != null && rule.optimalMax != null) {
    parts.push(`${rule.min}–${rule.optimalMax}`)
  } else if (rule.min != null) {
    parts.push(`${rule.min}+`)
  } else if (rule.optimalMax != null) {
    parts.push(`≤${rule.optimalMax}`)
  }
  return `${parts.join(' ')} ${rule.unit}`
}

function measure(value: string, unit: LengthUnit): number {
  if (unit === 'words') return countPlainWords(value)
  return stripHtmlPlain(value).length
}

export function evaluateLength(
  id: string,
  label: string,
  raw: string | number,
  rule: LengthRule,
  tab?: LengthWarning['tab'],
): LengthWarning | null {
  const value = typeof raw === 'number' ? raw : measure(String(raw), rule.unit)
  const unitLabel = rule.unit

  if (value === 0) {
    if (rule.min != null && rule.min > 0) {
      return {
        id,
        label,
        severity: 'empty',
        message: `Empty — aim for ${formatBand(rule)}`,
        value,
        unit: rule.unit,
        tab,
      }
    }
    return null
  }

  if (rule.min != null && value < rule.min) {
    return {
      id,
      label,
      severity: 'short',
      message: `Too short (${value} ${unitLabel}) — minimum ${rule.min}; ideal ${formatBand(rule)}`,
      value,
      unit: rule.unit,
      tab,
    }
  }

  if (rule.optimalMin != null && value < rule.optimalMin && (rule.min == null || value >= rule.min)) {
    return {
      id,
      label,
      severity: 'short',
      message: `A bit thin (${value} ${unitLabel}) — aim for ${formatBand(rule)}`,
      value,
      unit: rule.unit,
      tab,
    }
  }

  if (rule.max != null && value > rule.max) {
    return {
      id,
      label,
      severity: 'long',
      message: `Too long (${value} ${unitLabel}) — max ${rule.max}; split or trim (ideal ${formatBand(rule)})`,
      value,
      unit: rule.unit,
      tab,
    }
  }

  if (rule.optimalMax != null && value > rule.optimalMax) {
    return {
      id,
      label,
      severity: 'long',
      message: `Getting long (${value} ${unitLabel}) — ideal ${formatBand(rule)}`,
      value,
      unit: rule.unit,
      tab,
    }
  }

  return {
    id,
    label,
    severity: 'ok',
    message: `${value} ${unitLabel} — within range`,
    value,
    unit: rule.unit,
    tab,
  }
}

export function analyzeContentSectionWarnings(section: ContentSection, index: number): LengthWarning[] {
  const n = index + 1
  const prefix = `section-${section.id}`
  const warnings: LengthWarning[] = []
  const heading = section.heading?.trim() ?? ''

  if (heading) {
    const w = evaluateLength(
      `${prefix}-heading`,
      `Section ${n} heading`,
      heading,
      SEO_LANDING_LENGTH_RULES.sectionHeading,
      'content',
    )
    if (w && w.severity !== 'ok') warnings.push(w)
  }

  switch (section.type) {
    case 'rich_text': {
      const w = evaluateLength(
        `${prefix}-body`,
        `Section ${n} · Rich text`,
        section.html ?? '',
        SEO_LANDING_LENGTH_RULES.richTextSection,
        'content',
      )
      if (w) warnings.push(w)
      break
    }
    case 'callout': {
      const w = evaluateLength(
        `${prefix}-callout`,
        `Section ${n} · Callout`,
        section.html ?? '',
        SEO_LANDING_LENGTH_RULES.callout,
        'content',
      )
      if (w) warnings.push(w)
      break
    }
    case 'key_takeaways': {
      const items = (section.items ?? []).map((i) => stripHtmlPlain(i)).filter(Boolean)
      const countW = evaluateLength(
        `${prefix}-takeaway-count`,
        `Section ${n} · Takeaway count`,
        items.length,
        SEO_LANDING_LENGTH_RULES.takeawayCount,
        'content',
      )
      if (countW) warnings.push(countW)
      items.forEach((item, i) => {
        const w = evaluateLength(
          `${prefix}-takeaway-${i}`,
          `Section ${n} · Takeaway ${i + 1}`,
          item,
          SEO_LANDING_LENGTH_RULES.takeawayItem,
          'content',
        )
        if (w && w.severity !== 'ok') warnings.push(w)
      })
      break
    }
    case 'faqs': {
      const faqs = section.faqs ?? []
      const countW = evaluateLength(
        `${prefix}-faq-count`,
        `Section ${n} · FAQ count`,
        faqs.filter((f) => f.question.trim() && f.answer.trim()).length,
        SEO_LANDING_LENGTH_RULES.faqBlockCount,
        'content',
      )
      if (countW) warnings.push(countW)
      faqs.forEach((faq, i) => {
        if (!faq.question.trim() && !faq.answer.trim()) return
        const q = evaluateLength(
          `${prefix}-faq-q-${i}`,
          `Section ${n} · FAQ ${i + 1} question`,
          faq.question,
          SEO_LANDING_LENGTH_RULES.faqQuestion,
          'content',
        )
        const a = evaluateLength(
          `${prefix}-faq-a-${i}`,
          `Section ${n} · FAQ ${i + 1} answer`,
          faq.answer,
          SEO_LANDING_LENGTH_RULES.faqAnswer,
          'content',
        )
        if (q && q.severity !== 'ok') warnings.push(q)
        if (a && a.severity !== 'ok') warnings.push(a)
      })
      break
    }
    case 'how_to': {
      const steps = section.steps ?? []
      const countW = evaluateLength(
        `${prefix}-steps-count`,
        `Section ${n} · Step count`,
        steps.filter((s) => s.name.trim() || s.text.trim()).length,
        SEO_LANDING_LENGTH_RULES.howToStepCount,
        'content',
      )
      if (countW) warnings.push(countW)
      steps.forEach((step, i) => {
        if (!step.name.trim() && !step.text.trim()) return
        const nameW = evaluateLength(
          `${prefix}-step-name-${i}`,
          `Section ${n} · Step ${i + 1} title`,
          step.name,
          SEO_LANDING_LENGTH_RULES.howToStepName,
          'content',
        )
        const textW = evaluateLength(
          `${prefix}-step-text-${i}`,
          `Section ${n} · Step ${i + 1} body`,
          step.text,
          SEO_LANDING_LENGTH_RULES.howToStepText,
          'content',
        )
        if (nameW && nameW.severity !== 'ok') warnings.push(nameW)
        if (textW && textW.severity !== 'ok') warnings.push(textW)
      })
      break
    }
    case 'causes': {
      const rows = section.causes ?? []
      const countW = evaluateLength(
        `${prefix}-causes-count`,
        `Section ${n} · Cause rows`,
        rows.filter((r) => r.cause.trim() || r.fix.trim()).length,
        SEO_LANDING_LENGTH_RULES.causesRowCount,
        'content',
      )
      if (countW) warnings.push(countW)
      rows.forEach((row, i) => {
        if (!row.cause.trim() && !row.fix.trim()) return
        for (const [field, label] of [
          ['cause', 'Cause'],
          ['fix', 'Fix'],
        ] as const) {
          const w = evaluateLength(
            `${prefix}-${field}-${i}`,
            `Section ${n} · ${label} ${i + 1}`,
            row[field],
            SEO_LANDING_LENGTH_RULES.causeFixField,
            'content',
          )
          if (w && w.severity !== 'ok') warnings.push(w)
        }
      })
      break
    }
    case 'price_table': {
      const rows = section.rows ?? []
      const countW = evaluateLength(
        `${prefix}-price-count`,
        `Section ${n} · Price rows`,
        rows.filter((r) => r.item.trim()).length,
        SEO_LANDING_LENGTH_RULES.priceTableRows,
        'content',
      )
      if (countW) warnings.push(countW)
      break
    }
    case 'cards': {
      ;(section.cards ?? []).forEach((card, i) => {
        if (!card.title.trim() && !card.description?.trim()) return
        const titleW = evaluateLength(
          `${prefix}-card-title-${i}`,
          `Section ${n} · Card ${i + 1} title`,
          card.title,
          SEO_LANDING_LENGTH_RULES.cardTitle,
          'content',
        )
        const descW = card.description
          ? evaluateLength(
              `${prefix}-card-desc-${i}`,
              `Section ${n} · Card ${i + 1} description`,
              card.description,
              SEO_LANDING_LENGTH_RULES.cardDescription,
              'content',
            )
          : null
        if (titleW && titleW.severity !== 'ok') warnings.push(titleW)
        if (descW && descW.severity !== 'ok') warnings.push(descW)
      })
      break
    }
  }

  return warnings
}

export function analyzeSeoLandingLengthWarnings(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): LengthWarning[] {
  const warnings: LengthWarning[] = []

  if (kind !== 'providers') {
    const titleW = evaluateLength(
      'page-title',
      'Page title (H1)',
      String(draft.title ?? ''),
      SEO_LANDING_LENGTH_RULES.pageTitle,
      'setup',
    )
    if (titleW) warnings.push(titleW)

    if (kind === 'problems' || kind === 'cost-guides' || kind === 'guides') {
      const sub = String(draft.subtitle ?? '').trim()
      if (sub) {
        const subW = evaluateLength('subtitle', 'Subtitle', sub, SEO_LANDING_LENGTH_RULES.subtitle, 'setup')
        if (subW && subW.severity !== 'ok') warnings.push(subW)
      }
    }

    const qaW = evaluateLength(
      'quick-answer',
      'Quick answer',
      String(draft.quickAnswer ?? ''),
      SEO_LANDING_LENGTH_RULES.quickAnswer,
      'content',
    )
    if (qaW) warnings.push(qaW)

    const takeaways = Array.isArray(draft.keyTakeaways)
      ? draft.keyTakeaways.map(String).map(stripHtmlPlain).filter(Boolean)
      : []
    if (kind !== 'locations') {
      const countW = evaluateLength(
        'takeaway-count',
        'Key takeaways count',
        takeaways.length,
        SEO_LANDING_LENGTH_RULES.keyTakeawayBullets,
        'content',
      )
      if (countW) warnings.push(countW)
      takeaways.forEach((t, i) => {
        const w = evaluateLength(
          `takeaway-${i}`,
          `Key takeaway ${i + 1}`,
          t,
          SEO_LANDING_LENGTH_RULES.takeawayItem,
          'content',
        )
        if (w && w.severity !== 'ok') warnings.push(w)
      })
    }
  } else {
    const bioW = evaluateLength(
      'provider-bio',
      'Provider bio',
      String(draft.bio ?? ''),
      SEO_LANDING_LENGTH_RULES.providerBio,
      'content',
    )
    if (bioW) warnings.push(bioW)
  }

  const topFaqs = Array.isArray(draft.faqs) ? draft.faqs : []
  const filledFaqs = topFaqs.filter((f) => {
    if (!f || typeof f !== 'object') return false
    const o = f as Record<string, unknown>
    return Boolean(String(o.question ?? '').trim() && String(o.answer ?? '').trim())
  })
  if (filledFaqs.length > 0 || kind !== 'providers') {
    const faqCountW = evaluateLength(
      'top-faq-count',
      'Page FAQs count',
      filledFaqs.length,
      SEO_LANDING_LENGTH_RULES.faqBlockCount,
      'content',
    )
    if (faqCountW && (filledFaqs.length > 0 || faqCountW.severity !== 'ok')) warnings.push(faqCountW)
  }
  filledFaqs.forEach((f, i) => {
    const o = f as Record<string, unknown>
    const q = evaluateLength(
      `top-faq-q-${i}`,
      `FAQ ${i + 1} question`,
      String(o.question ?? ''),
      SEO_LANDING_LENGTH_RULES.faqQuestion,
      'content',
    )
    const a = evaluateLength(
      `top-faq-a-${i}`,
      `FAQ ${i + 1} answer`,
      String(o.answer ?? ''),
      SEO_LANDING_LENGTH_RULES.faqAnswer,
      'content',
    )
    if (q && q.severity !== 'ok') warnings.push(q)
    if (a && a.severity !== 'ok') warnings.push(a)
  })

  const sections = Array.isArray(draft.sections) ? (draft.sections as ContentSection[]) : []
  sections.forEach((section, index) => {
    warnings.push(...analyzeContentSectionWarnings(section, index))
  })

  if (kind === 'cost-guides' || kind === 'landing-pages') {
    const priceRows = Array.isArray(draft.priceTable) ? draft.priceTable : []
    const filled = priceRows.filter((r) => {
      if (!r || typeof r !== 'object') return false
      return Boolean(String((r as Record<string, unknown>).item ?? '').trim())
    })
    if (filled.length > 0 || kind === 'cost-guides') {
      const w = evaluateLength(
        'top-price-table',
        'Charge / price table rows',
        filled.length,
        SEO_LANDING_LENGTH_RULES.priceTableRows,
        'content',
      )
      if (w) warnings.push(w)
    }
  }

  const seo = draft.seo && typeof draft.seo === 'object' ? (draft.seo as Record<string, unknown>) : {}
  const customTitle = String(seo.title ?? '').trim()
  const customDesc = String(seo.description ?? '').trim()
  if (customTitle) {
    const w = evaluateLength('meta-title', 'SEO title', customTitle, SEO_LANDING_LENGTH_RULES.metaTitle, 'seo')
    if (w) warnings.push(w)
  }
  if (customDesc) {
    const w = evaluateLength(
      'meta-description',
      'Meta description',
      customDesc,
      SEO_LANDING_LENGTH_RULES.metaDescription,
      'seo',
    )
    if (w) warnings.push(w)
  }

  return warnings
}

export function lengthWarningsNeedAttention(warnings: LengthWarning[]): LengthWarning[] {
  return warnings.filter((w) => w.severity === 'short' || w.severity === 'long' || w.severity === 'empty')
}

export function sectionHasLengthIssues(section: ContentSection, index: number): boolean {
  return lengthWarningsNeedAttention(analyzeContentSectionWarnings(section, index)).length > 0
}
