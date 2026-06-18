/**
 * Near-me SEO helpers — aligned with fixer-client `nearMePages.ts` / `nearMeServer.ts`.
 * Admin uses these for URL previews, autofill, and readiness checks.
 */
import type { CategoryMarketingConfig, NearMeSeoCmsFields } from '../types/categoryMarketing'
import {
  META_DESC_HARD_MAX_CHARS,
  META_DESC_MIN_CHARS,
  SEO_TITLE_HARD_MAX_CHARS,
} from '../components/blog/blog-seo-guidelines'
import {
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
} from './serviceCatalogUrlSlugs'

export function buildNearMeCategoryPublicPath(storageSlug: string): string {
  return `/near-me/${getPreferredServiceCategoryUrlSlug(storageSlug)}`
}

export function buildNearMeLocalityPublicPath(storageSlug: string, localitySlug: string): string {
  const cat = getPreferredServiceCategoryUrlSlug(storageSlug)
  const loc = localitySlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
  return `/near-me/${cat}/${loc}`
}

export function resolveNearMePreviewUrl(
  storageSlug: string,
  localitySlug: string,
  origin: string,
): string {
  const o = origin.replace(/\/$/, '')
  if (localitySlug.trim()) {
    return `${o}${buildNearMeLocalityPublicPath(storageSlug, localitySlug)}`
  }
  return `${o}${buildNearMeCategoryPublicPath(storageSlug)}`
}

function trimEndEllipsis(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, Math.max(0, max - 1)).trimEnd()
  return `${cut}…`
}

export type DefaultNearMeSeoInput = {
  industryLabel: string
  localityLabel?: string
  localitySlug?: string
  /** Public origin without trailing slash — used for suggested canonical paths. */
  publicOrigin?: string
  /** CMS storage slug e.g. `electric` */
  storageSlug: string
}

/** Industry-standard starter copy for `/near-me/{category}` and composite locality keys. */
export function buildDefaultNearMeSeoCopy(input: DefaultNearMeSeoInput): NearMeSeoCmsFields {
  const { industryLabel, localityLabel, localitySlug, publicOrigin = '', storageSlug } = input
  const service = industryLabel.trim()
  const serviceLower = service.toLowerCase()
  const loc = (localityLabel ?? '').trim()
  const locShort = loc.split(',')[0]?.trim() || loc
  const isLocal = Boolean(loc)

  const title = isLocal
    ? trimEndEllipsis(`${serviceLower} near me in ${locShort}`, SEO_TITLE_HARD_MAX_CHARS)
    : trimEndEllipsis(`${serviceLower} near me`, SEO_TITLE_HARD_MAX_CHARS)

  const description = isLocal
    ? trimEndEllipsis(
        `Book verified ${serviceLower} near you in ${loc}. Same-day slots, transparent pricing, and digital invoices on Profixer.`,
        META_DESC_HARD_MAX_CHARS,
      )
    : trimEndEllipsis(
        `Book verified ${serviceLower} near you in Mumbai, Thane & Navi Mumbai. Transparent pricing and same-day slots on Profixer.`,
        META_DESC_HARD_MAX_CHARS,
      )

  const keywords = isLocal
    ? [
        `${serviceLower} near me`,
        `${serviceLower} near me ${locShort.toLowerCase()}`,
        `near me ${locShort.toLowerCase()}`,
        locShort.toLowerCase(),
        ...(localitySlug ? [localitySlug.replace(/-/g, ' ')] : []),
      ]
    : [serviceLower, `${serviceLower} near me`, 'near me', 'Mumbai', 'home services near me']

  const origin = publicOrigin.replace(/\/$/, '')
  const preferred = getPreferredServiceCategoryUrlSlug(storageSlug)
  const canonicalPath = isLocal && localitySlug
    ? buildNearMeLocalityPublicPath(storageSlug, localitySlug)
    : buildNearMeCategoryPublicPath(storageSlug)

  // Industry best practice: near-me pages often canonicalize to the richer /services/ URL to avoid cannibalization.
  // Leave blank (self-canonical) by default — editors opt in by setting canonicalPath to /services/…
  const servicesCanonical =
    isLocal && localitySlug && origin
      ? `${origin}${buildServiceLocalityPublicPath(storageSlug, localitySlug)}`
      : origin
        ? `${origin}/services/${preferred}`
        : buildServiceLocalityPublicPath(storageSlug, localitySlug ?? '')

  void servicesCanonical

  return {
    title,
    description: description.length < META_DESC_MIN_CHARS ? `${description} Book online today.` : description,
    keywords: Array.from(new Set(keywords.filter(Boolean))),
    canonicalPath,
    robotsMeta: '',
  }
}

export type NearMeReadinessRow = { tone: 'ok' | 'warn' | 'info'; title: string; detail: string }

export function assessNearMeSeoReadiness(
  cfg: CategoryMarketingConfig,
  ctx: { industryLabel: string; localityLabel: string; nearMeUrl: string; servicesUrl: string },
): NearMeReadinessRow[] {
  const rows: NearMeReadinessRow[] = []
  const nm = cfg.nearMeSeo
  const title = nm.title.trim()
  const desc = nm.description.trim()
  const kw = nm.keywords.filter((k) => k.trim()).length

  if (!title) {
    rows.push({
      tone: 'info',
      title: 'Near-me title',
      detail: `Blank — consumer uses smart default (“${ctx.industryLabel.toLowerCase()} near me…”). Add a override for SERP control.`,
    })
  } else if (!title.toLowerCase().includes('near')) {
    rows.push({
      tone: 'warn',
      title: 'Near-me title',
      detail: 'Missing “near me” intent — include it for geo-query alignment.',
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me title', detail: `Set (${title.length} chars).` })
  }

  if (!desc) {
    rows.push({
      tone: 'info',
      title: 'Near-me meta description',
      detail: 'Blank — consumer falls back to a template. Add benefit-led copy with area + CTA.',
    })
  } else if (desc.length < META_DESC_MIN_CHARS) {
    rows.push({
      tone: 'warn',
      title: 'Near-me meta description',
      detail: `Thin (${desc.length} chars) — aim for ~${META_DESC_MIN_CHARS}–160.`,
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me meta description', detail: `Good length (${desc.length} chars).` })
  }

  if (kw === 0) {
    rows.push({
      tone: 'info',
      title: 'Near-me keywords',
      detail: 'None — consumer auto-builds from category + locality.',
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me keywords', detail: `${kw} keyword(s) set.` })
  }

  const can = nm.canonicalPath.trim()
  if (can && can !== ctx.nearMeUrl.replace(/^https?:\/\/[^/]+/, '')) {
    rows.push({
      tone: 'info',
      title: 'Near-me canonical',
      detail: `Points to ${can} — consolidates signals away from ${ctx.nearMeUrl}.`,
    })
  } else if (ctx.localityLabel) {
    rows.push({
      tone: 'info',
      title: 'Near-me canonical',
      detail: `Self-canonical on near-me URL. If you see overlap with ${ctx.servicesUrl}, set canonical to the /services/ path.`,
    })
  }

  return rows
}

export type NapReadinessRow = { tone: 'ok' | 'warn' | 'info'; title: string; detail: string }

/** NAP + citation completeness for local SEO / LocalBusiness schema. */
export function assessNapCitationsReadiness(cfg: CategoryMarketingConfig): NapReadinessRow[] {
  const rows: NapReadinessRow[] = []
  const ls = cfg.localSeo
  const phone = cfg.contactPhone.trim()
  const street = ls.streetAddress.trim()
  const locality = ls.addressLocality.trim()
  const postal = ls.postalCode.trim()
  const gbp = ls.googleBusinessProfileUrl.trim()
  const sameAs = ls.sameAsUrls.map((u) => u.trim()).filter(Boolean)
  const geo = ls.geoLatLng.trim()

  if (ls.enableLocalBusinessSchema) {
    if (!phone) {
      rows.push({
        tone: 'warn',
        title: 'NAP phone',
        detail: 'LocalBusiness schema is on but phone is empty — falls back to registered office; match GBP for trust.',
      })
    } else {
      rows.push({ tone: 'ok', title: 'NAP phone', detail: 'Set — feeds schema `telephone`.' })
    }

    if (!street || !locality || !postal) {
      rows.push({
        tone: 'warn',
        title: 'NAP address',
        detail: 'Incomplete street / city / PIN — complete before enabling schema; must match GBP exactly.',
      })
    } else {
      rows.push({ tone: 'ok', title: 'NAP address', detail: 'Street, city, and PIN present.' })
    }

    if (!gbp) {
      rows.push({
        tone: 'warn',
        title: 'Google Business Profile',
        detail: 'No GBP URL — add your verified Maps listing for citation consistency.',
      })
    } else {
      rows.push({ tone: 'ok', title: 'Google Business Profile', detail: 'GBP URL set.' })
    }

    if (sameAs.length === 0) {
      rows.push({
        tone: 'info',
        title: 'Citations (sameAs)',
        detail: 'No directory/social URLs — add 2–5 verified listings (Justdial, Sulekha, Facebook, etc.).',
      })
    } else {
      rows.push({ tone: 'ok', title: 'Citations (sameAs)', detail: `${sameAs.length} citation URL(s).` })
    }

    if (!geo) {
      rows.push({
        tone: 'info',
        title: 'Geo coordinates',
        detail: 'Optional but recommended — use verified storefront lat,lng for map-pack alignment.',
      })
    } else {
      rows.push({ tone: 'ok', title: 'Geo coordinates', detail: 'Set for JSON-LD `geo`.' })
    }
  } else {
    rows.push({
      tone: 'info',
      title: 'LocalBusiness schema',
      detail: 'Off — NAP fields still enrich Service nodes when typed as a LocalBusiness subtype. Enable when NAP matches GBP.',
    })
    if (phone || street || gbp) {
      rows.push({
        tone: 'info',
        title: 'NAP partial data',
        detail: 'Some NAP/citation fields are filled — flip on LocalBusiness schema once verified against GBP.',
      })
    }
  }

  return rows
}
