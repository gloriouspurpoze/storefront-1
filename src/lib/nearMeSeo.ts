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
    introHtml: isLocal
      ? `<p>Book verified ${serviceLower} near you in ${loc}. Same-day slots when available, transparent pricing, and digital invoices on ProFixer.</p>`
      : '',
    keyTakeaways: isLocal
      ? [
          'Same-day booking when slots allow',
          'Verified technicians with transparent pricing',
          '30-day workmanship warranty on eligible jobs',
        ]
      : [],
    faqs: isLocal
      ? [
          {
            question: `How do I book ${serviceLower} near me in ${locShort}?`,
            answer: `Choose your service on ProFixer, confirm ${locShort} as your area, and pick the earliest available slot online or by phone.`,
          },
          {
            question: 'Do you cover nearby neighbourhoods?',
            answer: `Yes — use the area locator on this page to compare ${serviceLower} options in neighbourhoods near ${locShort}.`,
          },
        ]
      : [],
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

  const intro = nm.introHtml.trim()
  if (!intro) {
    rows.push({
      tone: 'info',
      title: 'Near-me intro',
      detail: 'Blank — page shows meta description only. Add intro HTML for booking context.',
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me intro', detail: `${intro.replace(/<[^>]*>/g, ' ').trim().length} chars body copy.` })
  }

  const takeaways = nm.keyTakeaways.filter((t) => t.trim()).length
  if (takeaways === 0) {
    rows.push({
      tone: 'info',
      title: 'Near-me key takeaways',
      detail: 'Optional — add 3–5 trust bullets (same-day, pricing, warranty).',
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me key takeaways', detail: `${takeaways} bullet(s).` })
  }

  const faqCount = nm.faqs.filter((f) => f.question.trim() && f.answer.trim()).length
  if (faqCount < 2) {
    rows.push({
      tone: faqCount === 0 ? 'info' : 'warn',
      title: 'Near-me FAQs',
      detail: faqCount === 0 ? 'Add 2–5 booking FAQs for on-page + FAQ schema.' : `${faqCount}/2+ FAQ pairs.`,
    })
  } else {
    rows.push({ tone: 'ok', title: 'Near-me FAQs', detail: `${faqCount} FAQ pair(s).` })
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

/** Map SEO landing / URL slug to category-marketing catalog storage key. */
export function resolveCatalogStorageSlugForNearMe(
  serviceSlug: string,
  catalogOptions: readonly { value: string }[],
): string {
  const raw = serviceSlug.trim().toLowerCase()
  if (!raw) return raw
  const hit = catalogOptions.find(
    (o) =>
      o.value.toLowerCase() === raw ||
      getPreferredServiceCategoryUrlSlug(o.value).toLowerCase() === raw,
  )
  return hit?.value ?? raw
}

/** Deep link to Industry service pages → near-me CMS block. */
export function buildCategoryMarketingNearMeEditUrl(
  serviceSlug: string,
  localitySlug?: string,
  catalogOptions: readonly { value: string }[] = [],
): string {
  const catalog = catalogOptions.length
    ? resolveCatalogStorageSlugForNearMe(serviceSlug, catalogOptions)
    : serviceSlug.trim()
  const params = new URLSearchParams()
  params.set('tab', 'landing')
  if (catalog) params.set('catalog', catalog)
  if (localitySlug?.trim()) params.set('locality', localitySlug.trim().toLowerCase())
  params.set('section', 'near-me')
  return `/cms/category-marketing?${params.toString()}`
}
