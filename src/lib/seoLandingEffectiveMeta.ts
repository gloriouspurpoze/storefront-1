/**
 * Meta title & description — aligned with consumer `generateMetadata` on profixer.in.
 */
import type { SeoLandingEntityKind } from './seoLandingPageKinds'

const BRAND = 'ProFixer'

export function stripHtmlForMeta(s?: string): string {
  return (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function seoObj(draft: Record<string, unknown>): Record<string, unknown> {
  const seo = draft.seo
  return seo && typeof seo === 'object' ? (seo as Record<string, unknown>) : {}
}

export function resolveSeoLandingLocationLabel(draft: Record<string, unknown>): string | undefined {
  const name = String(draft.locationName ?? '').trim()
  if (name) return name
  const slug = String(draft.locationSlug ?? '').trim()
  if (!slug) return undefined
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function serviceLabel(draft: Record<string, unknown>, catalogLabelMap: Record<string, string>): string {
  const slug = String(draft.serviceSlug ?? draft.service ?? '').trim()
  if (!slug) return 'home service'
  const norm = slug.toLowerCase().replace(/_/g, '-')
  return (catalogLabelMap[norm] ?? catalogLabelMap[slug] ?? slug.replace(/-/g, ' ')).toLowerCase()
}

/** What Google will show — custom SEO field or consumer auto fallback. */
export function effectiveSeoLandingMetaTitle(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  catalogLabelMap: Record<string, string> = {},
): { value: string; source: 'seo' | 'page' | 'name' | 'empty' } {
  const custom = String(seoObj(draft).title ?? '').trim()
  if (custom) return { value: custom, source: 'seo' }

  const locationLabel = resolveSeoLandingLocationLabel(draft)

  if (kind === 'providers') {
    const name = String(draft.name ?? '').trim()
    return name ? { value: `${name} | ${BRAND}`, source: 'name' } : { value: '', source: 'empty' }
  }

  if (kind === 'locations') {
    const areaName = String(draft.name ?? '').trim()
    return areaName
      ? { value: `Home Services in ${areaName} | ${BRAND}`, source: 'page' }
      : { value: '', source: 'empty' }
  }

  const title = String(draft.title ?? '').trim()
  if (!title) return { value: '', source: 'empty' }

  if (kind === 'cost-guides') {
    return { value: `${title} | ${BRAND}`, source: 'page' }
  }

  if (kind === 'landing-pages') {
    const legacy = String(draft.metaTitle ?? '').trim()
    if (legacy) return { value: legacy, source: 'page' }
    return { value: `${title} | ${BRAND}`, source: 'page' }
  }

  // problems, guides — location in title when set (matches consumer)
  const locSuffix = locationLabel ? ` in ${locationLabel}` : ''
  return { value: `${title}${locSuffix} | ${BRAND}`, source: 'page' }
}

/** Live-site meta description — custom field or quick answer / bio fallback. */
export function effectiveSeoLandingMetaDescription(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  catalogLabelMap: Record<string, string> = {},
): { value: string; source: 'seo' | 'quickAnswer' | 'bio' | 'location' | 'empty' } {
  const custom = String(seoObj(draft).description ?? '').trim()
  if (custom) return { value: custom, source: 'seo' }

  if (kind === 'providers') {
    const bio = stripHtmlForMeta(String(draft.bio ?? ''))
    return bio ? { value: bio, source: 'bio' } : { value: '', source: 'empty' }
  }

  if (kind === 'locations') {
    const qa = stripHtmlForMeta(String(draft.quickAnswer ?? ''))
    if (qa) return { value: qa, source: 'quickAnswer' }
    const areaName = String(draft.name ?? '').trim()
    if (areaName) {
      return {
        value: `Book AC repair, plumber & electrician in ${areaName}, Mumbai. Verified professionals, transparent pricing, same-day slots on ProFixer.in.`,
        source: 'location',
      }
    }
    return { value: '', source: 'empty' }
  }

  const qaPlain = stripHtmlForMeta(String(draft.quickAnswer ?? ''))
  if (!qaPlain) return { value: '', source: 'empty' }

  if (kind === 'cost-guides') {
    const label = serviceLabel(draft, catalogLabelMap)
    return {
      value: `${qaPlain.slice(0, 150)} Transparent ${label} charges & verified professionals on ${BRAND}.`,
      source: 'quickAnswer',
    }
  }

  if (kind === 'landing-pages' || kind === 'problems') {
    return {
      value: `${qaPlain.slice(0, 150)} Book verified professionals on ${BRAND}.`,
      source: 'quickAnswer',
    }
  }

  // guides — full quick answer (consumer uses stripHtml without suffix)
  return { value: qaPlain, source: 'quickAnswer' }
}

/** Suggested custom SEO title to paste into the SEO title field (publish-ready). */
export function suggestSeoLandingMetaTitle(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  catalogLabelMap: Record<string, string> = {},
): string {
  return effectiveSeoLandingMetaTitle(kind, draft, catalogLabelMap).value
}

/** Suggested meta description trimmed to SERP-safe length (~158 chars). */
export function suggestSeoLandingMetaDescription(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  catalogLabelMap: Record<string, string> = {},
): string {
  const raw = effectiveSeoLandingMetaDescription(kind, draft, catalogLabelMap).value
  if (!raw) return ''
  if (raw.length <= 158) return raw
  const cut = raw.slice(0, 155).replace(/\s+\S*$/, '').trim()
  return cut.endsWith('.') ? cut : `${cut}…`
}

export function hasCustomSeoTitle(draft: Record<string, unknown>): boolean {
  return Boolean(String(seoObj(draft).title ?? '').trim())
}

export function hasCustomSeoDescription(draft: Record<string, unknown>): boolean {
  return Boolean(String(seoObj(draft).description ?? '').trim())
}
