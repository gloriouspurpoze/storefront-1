/**
 * Mirrors consumer `validateEntity()` — what profixer.in applies before indexing.
 * Keep aligned with user-site-fixerwebapp/src/shared/lib/seo/entities/validation.ts
 */
import type { SeoLandingEntityKind } from './seoLandingPageKinds'
import {
  estimateSeoLandingWordCount,
  SEO_LANDING_MIN_WORDS,
} from './seoLandingPageKinds'
import { isValidSeoLandingSlug } from './seoLandingSlug'
import { stripHtmlForMeta } from './seoLandingEffectiveMeta'

export type ConsumerIndexStatus = 'publishable' | 'draft_noindex' | 'blocked'

export type ConsumerValidationResult = {
  ok: boolean
  errors: string[]
  status: ConsumerIndexStatus
  statusLabel: string
  statusDetail: string
  wordCount: number
}

function stripHtml(s?: string): string {
  return stripHtmlForMeta(s)
}

function countFaqs(draft: Record<string, unknown>): number {
  let n = 0
  if (Array.isArray(draft.faqs)) {
    n += draft.faqs.filter((f) => {
      if (!f || typeof f !== 'object') return false
      const o = f as Record<string, unknown>
      return Boolean(String(o.question ?? '').trim() && String(o.answer ?? '').trim())
    }).length
  }
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    if (sec.type === 'faqs' && Array.isArray(sec.faqs)) {
      n += sec.faqs.filter((f) => {
        if (!f || typeof f !== 'object') return false
        const o = f as Record<string, unknown>
        return Boolean(String(o.question ?? '').trim() && String(o.answer ?? '').trim())
      }).length
    }
  }
  return n
}

function priceRowCount(draft: Record<string, unknown>): number {
  let n = 0
  if (Array.isArray(draft.priceTable)) {
    n += draft.priceTable.filter((r) => {
      if (!r || typeof r !== 'object') return false
      return Boolean(String((r as Record<string, unknown>).item ?? '').trim())
    }).length
  }
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    if (sec.type === 'price_table' && Array.isArray(sec.rows)) {
      n += sec.rows.filter((r) => {
        if (!r || typeof r !== 'object') return false
        return Boolean(String((r as Record<string, unknown>).item ?? '').trim())
      }).length
    }
  }
  return n
}

function takeawayCount(draft: Record<string, unknown>): number {
  let n = 0
  if (Array.isArray(draft.keyTakeaways)) {
    n += draft.keyTakeaways.map(String).filter((t) => t.trim()).length
  }
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    if (sec.type === 'key_takeaways' && Array.isArray(sec.items)) {
      n += sec.items.map(String).filter((t) => t.trim()).length
    }
  }
  return n
}

function kindToConsumerEntity(kind: SeoLandingEntityKind): string {
  switch (kind) {
    case 'problems':
      return 'problem'
    case 'cost-guides':
      return 'cost'
    case 'guides':
      return 'guide'
    case 'providers':
      return 'provider'
    case 'locations':
      return 'location'
    case 'landing-pages':
      return 'service'
    default:
      return 'problem'
  }
}

/** Consumer-side indexability check (same gates as live site). */
export function validateSeoLandingForConsumer(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): ConsumerValidationResult {
  const errors: string[] = []
  const slug = String(draft.slug ?? '').trim()
  const wordCount = estimateSeoLandingWordCount(kind, draft)
  const noindex = Boolean(
    draft.seo && typeof draft.seo === 'object' && (draft.seo as Record<string, unknown>).noindex,
  )

  if (!isValidSeoLandingSlug(slug)) {
    errors.push('Invalid or missing URL slug')
  }

  const entity = kindToConsumerEntity(kind)

  switch (entity) {
    case 'problem':
      if (stripHtml(String(draft.quickAnswer ?? '')).length < 40) {
        errors.push('Quick answer too short (min 40 chars plain text)')
      }
      if (takeawayCount(draft) < 1) {
        errors.push('Missing key takeaways (required for problem pages)')
      }
      if (wordCount < SEO_LANDING_MIN_WORDS) {
        errors.push(`Body under ${SEO_LANDING_MIN_WORDS} words (${wordCount} now)`)
      }
      if (!String(draft.serviceSlug ?? '').trim()) {
        errors.push('Service category required for local Service schema')
      }
      break
    case 'cost':
      if (priceRowCount(draft) < 1) {
        errors.push('Cost guide needs at least one price table row')
      }
      if (stripHtml(String(draft.quickAnswer ?? '')).length < 40) {
        errors.push('Quick answer too short (min 40 chars)')
      }
      if (wordCount < SEO_LANDING_MIN_WORDS) {
        errors.push(`Body under ${SEO_LANDING_MIN_WORDS} words (${wordCount} now)`)
      }
      if (!String(draft.serviceSlug ?? '').trim()) {
        errors.push('Service category required')
      }
      break
    case 'guide':
      if (stripHtml(String(draft.quickAnswer ?? '')).length < 40) {
        errors.push('Quick answer too short (min 40 chars)')
      }
      if (wordCount < SEO_LANDING_MIN_WORDS) {
        errors.push(`Body under ${SEO_LANDING_MIN_WORDS} words (${wordCount} now)`)
      }
      break
    case 'provider':
      if (!String(draft.name ?? '').trim()) {
        errors.push('Provider name required')
      }
      if (wordCount < SEO_LANDING_MIN_WORDS) {
        errors.push(`Bio/content under ${SEO_LANDING_MIN_WORDS} words (${wordCount} now)`)
      }
      break
    case 'location':
      if (!String(draft.name ?? '').trim()) {
        errors.push('Area display name required')
      }
      if (wordCount < SEO_LANDING_MIN_WORDS) {
        errors.push(`Area content under ${SEO_LANDING_MIN_WORDS} words (${wordCount} now)`)
      }
      break
    case 'service':
      if (!String(draft.title ?? '').trim()) {
        errors.push('Page title required')
      }
      if (!String(draft.serviceSlug ?? '').trim()) {
        errors.push('Service category required')
      }
      if (!String(draft.locationSlug ?? '').trim()) {
        errors.push('Service area required for local money pages')
      }
      break
    default:
      break
  }

  const faqs = countFaqs(draft)
  if (kind !== 'providers' && faqs < 3) {
    errors.push(`FAQs: ${faqs}/3 recommended for FAQ rich results`)
  }

  const ok = errors.filter((e) => !e.startsWith('FAQs:')).length === 0

  let status: ConsumerIndexStatus
  let statusLabel: string
  let statusDetail: string

  if (!ok) {
    status = 'draft_noindex'
    statusLabel = 'Draft — consumer will force noindex'
    statusDetail =
      'The live site auto-sets noindex until quality gates pass, even if you turn indexing on here.'
  } else if (noindex) {
    status = 'blocked'
    statusLabel = 'Ready but hidden (noindex on)'
    statusDetail = 'Content passes consumer gates. Turn off noindex and save to allow Google indexing.'
  } else {
    status = 'publishable'
    statusLabel = 'Ready for Google'
    statusDetail = 'Passes consumer validation and is indexable — included in sitemap after save (~1h cache).'
  }

  return { ok, errors, status, statusLabel, statusDetail, wordCount }
}
