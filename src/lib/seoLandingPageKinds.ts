import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  BookOpen,
  DollarSign,
  LayoutTemplate,
  MapPin,
  User,
} from 'lucide-react'

export type SeoLandingEntityKind =
  | 'problems'
  | 'cost-guides'
  | 'guides'
  | 'providers'
  | 'locations'
  | 'landing-pages'

export type SeoLandingKindMeta = {
  id: SeoLandingEntityKind
  label: string
  shortLabel: string
  pathPrefix: string
  icon: LucideIcon
  description: string
  exampleSlug: string
  exampleUrl: string
  /** What editors should optimize for on this page type. */
  intent: string
}

const ORIGIN = 'https://www.profixer.in'

export const SEO_LANDING_KINDS: SeoLandingKindMeta[] = [
  {
    id: 'problems',
    label: 'Problem pages',
    shortLabel: 'Problems',
    pathPrefix: '/problems',
    icon: AlertCircle,
    description: '“Why is my AC not cooling?” style diagnostic pages that capture problem-intent searches.',
    exampleSlug: 'ac-not-cooling',
    exampleUrl: `${ORIGIN}/problems/ac-not-cooling`,
    intent: 'Problem + cause + fix + link to booking',
  },
  {
    id: 'cost-guides',
    label: 'Service charges',
    shortLabel: 'Charges',
    pathPrefix: '/charges',
    icon: DollarSign,
    description: 'Transparent price guides with tables — targets “AC repair cost in …” queries.',
    exampleSlug: 'ac-repair-cost-mira-bhayandar',
    exampleUrl: `${ORIGIN}/charges/ac-repair-cost-mira-bhayandar`,
    intent: 'Price transparency + year-stamped charges',
  },
  {
    id: 'guides',
    label: 'How-to guides',
    shortLabel: 'Guides',
    pathPrefix: '/guide',
    icon: BookOpen,
    description: 'Step-by-step how-to content for informational queries that funnel to booking.',
    exampleSlug: 'how-to-clean-ac-filter',
    exampleUrl: `${ORIGIN}/guide/how-to-clean-ac-filter`,
    intent: 'HowTo schema + practical steps',
  },
  {
    id: 'providers',
    label: 'Provider profiles',
    shortLabel: 'Providers',
    pathPrefix: '/provider',
    icon: User,
    description: 'Individual professional or partner profiles for E-E-A-T and long-tail names.',
    exampleSlug: 'rahul-sharma-electrician',
    exampleUrl: `${ORIGIN}/provider/rahul-sharma-electrician`,
    intent: 'Person / provider trust signals',
  },
  {
    id: 'locations',
    label: 'Area pages',
    shortLabel: 'Areas',
    pathPrefix: '/areas',
    icon: MapPin,
    description: 'Neighbourhood hub pages — enrich auto-generated /areas URLs with unique stats & copy.',
    exampleSlug: 'mira-bhayandar',
    exampleUrl: `${ORIGIN}/areas/mira-bhayandar`,
    intent: 'Local authority + neighbour internal links',
  },
  {
    id: 'landing-pages',
    label: 'Local money pages',
    shortLabel: 'Local pages',
    pathPrefix: '/',
    icon: LayoutTemplate,
    description: 'Flat top-level slugs (e.g. /mumbai-ac-service-…) for high-intent local money keywords.',
    exampleSlug: 'mumbai-ac-service-repair-bhayandar-west-thane',
    exampleUrl: `${ORIGIN}/mumbai-ac-service-repair-bhayandar-west-thane`,
    intent: 'Self-canonical money page or canonical → /services/…',
  },
]

export function kindMeta(kind: SeoLandingEntityKind): SeoLandingKindMeta {
  return SEO_LANDING_KINDS.find((k) => k.id === kind) ?? SEO_LANDING_KINDS[0]
}

export function publicUrlForKind(kind: SeoLandingEntityKind, slug: string): string {
  const prefix = kindMeta(kind).pathPrefix
  if (!slug) return prefix || '/'
  return prefix ? `${prefix}/${slug}` : `/${slug}`
}

/** Industry target: substantive programmatic pages (≈1,500–2,500+ words). */
export const SEO_LANDING_MIN_WORDS = 1500
export const SEO_LANDING_OPTIMAL_WORDS = 2500
export const SEO_LANDING_MIN_INTERNAL_LINKS = 3

const stripHtml = (s?: string) => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

function countWords(text: string): number {
  const t = stripHtml(text)
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

/** Mirrors consumer `effectiveContentLength` but counts words for publish gates. */
export function estimateSeoLandingWordCount(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): number {
  const chunks: string[] = []

  if (kind === 'providers') {
    chunks.push(String(draft.name ?? ''), String(draft.bio ?? ''))
  } else if (kind === 'locations') {
    chunks.push(
      String(draft.name ?? ''),
      String(draft.subtitle ?? ''),
      String(draft.quickAnswer ?? ''),
      String(draft.city ?? ''),
    )
  } else {
    chunks.push(
      String(draft.title ?? ''),
      String(draft.subtitle ?? ''),
      String(draft.quickAnswer ?? ''),
      String(draft.body ?? ''),
    )
    if (Array.isArray(draft.keyTakeaways)) {
      chunks.push(...draft.keyTakeaways.map(String))
    }
  }

  if (Array.isArray(draft.faqs)) {
    for (const f of draft.faqs) {
      if (f && typeof f === 'object') {
        const o = f as Record<string, unknown>
        chunks.push(String(o.question ?? ''), String(o.answer ?? ''))
      }
    }
  }

  const sections = Array.isArray(draft.sections) ? draft.sections : []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    chunks.push(String(sec.heading ?? ''))
    if (sec.type === 'rich_text' || sec.type === 'callout') chunks.push(String(sec.html ?? ''))
    if (sec.type === 'key_takeaways' && Array.isArray(sec.items)) chunks.push(...sec.items.map(String))
    if (sec.type === 'faqs' && Array.isArray(sec.faqs)) {
      for (const f of sec.faqs) {
        if (f && typeof f === 'object') {
          const o = f as Record<string, unknown>
          chunks.push(String(o.question ?? ''), String(o.answer ?? ''))
        }
      }
    }
    if (sec.type === 'how_to' && Array.isArray(sec.steps)) {
      for (const st of sec.steps) {
        if (st && typeof st === 'object') {
          const o = st as Record<string, unknown>
          chunks.push(String(o.name ?? ''), String(o.text ?? ''))
        }
      }
    }
    if (sec.type === 'causes' && Array.isArray(sec.causes)) {
      for (const c of sec.causes) {
        if (c && typeof c === 'object') {
          const o = c as Record<string, unknown>
          chunks.push(String(o.cause ?? ''), String(o.fix ?? ''))
        }
      }
    }
    if (sec.type === 'price_table' && Array.isArray(sec.rows)) {
      for (const r of sec.rows) {
        if (r && typeof r === 'object') {
          const o = r as Record<string, unknown>
          chunks.push(String(o.item ?? ''), String(o.note ?? ''))
        }
      }
    }
    if (sec.type === 'cards' && Array.isArray(sec.cards)) {
      for (const c of sec.cards) {
        if (c && typeof c === 'object') {
          const o = c as Record<string, unknown>
          chunks.push(String(o.title ?? ''), String(o.description ?? ''), String(o.value ?? ''))
        }
      }
    }
  }

  if (Array.isArray(draft.priceTable)) {
    for (const r of draft.priceTable) {
      if (r && typeof r === 'object') {
        const o = r as Record<string, unknown>
        chunks.push(String(o.item ?? ''), String(o.note ?? ''))
      }
    }
  }

  return chunks.reduce((sum, c) => sum + countWords(c), 0)
}

function countInternalLinks(draft: Record<string, unknown>): number {
  if (!Array.isArray(draft.relatedLinks)) return 0
  return draft.relatedLinks.filter((row) => {
    if (!row || typeof row !== 'object') return false
    const o = row as Record<string, unknown>
    return Boolean(String(o.label ?? '').trim() && String(o.url ?? o.href ?? '').trim())
  }).length
}

export type PublishGate = { label: string; ok: boolean; detail: string }

export function publishGatesForDraft(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  bodyLen: number,
): PublishGate[] {
  const gates: PublishGate[] = []
  const wordCount = estimateSeoLandingWordCount(kind, draft)
  const linkCount = countInternalLinks(draft)

  if (kind === 'providers') {
    const name = String(draft.name ?? '').trim()
    gates.push({
      label: 'Name',
      ok: name.length > 0,
      detail: name ? 'Set' : 'Add provider name',
    })
  } else {
    const qa = String(draft.quickAnswer ?? '').trim().length
    gates.push({
      label: 'Quick answer',
      ok: qa >= 40,
      detail: qa >= 40 ? `${qa} chars` : `${qa}/40 chars (draft stays noindex until filled)`,
    })
  }

  gates.push({
    label: 'Word count',
    ok: wordCount >= SEO_LANDING_MIN_WORDS,
    detail:
      wordCount >= SEO_LANDING_OPTIMAL_WORDS
        ? `${wordCount} words (optimal band)`
        : wordCount >= SEO_LANDING_MIN_WORDS
          ? `${wordCount} words (aim for ${SEO_LANDING_OPTIMAL_WORDS}+)`
          : `${wordCount}/${SEO_LANDING_MIN_WORDS} words minimum`,
  })

  gates.push({
    label: 'Internal links',
    ok: linkCount >= SEO_LANDING_MIN_INTERNAL_LINKS,
    detail:
      linkCount >= SEO_LANDING_MIN_INTERNAL_LINKS
        ? `${linkCount} editorial links`
        : `${linkCount}/${SEO_LANDING_MIN_INTERNAL_LINKS} recommended`,
  })

  void bodyLen

  const noindex = Boolean((draft.seo as Record<string, unknown> | undefined)?.noindex)
  gates.push({
    label: 'Indexable',
    ok: !noindex,
    detail: noindex ? 'Noindex is on' : 'Eligible for sitemap when gates pass',
  })
  return gates
}

export function pageListTitle(kind: SeoLandingEntityKind, draft: Record<string, unknown>): string {
  if (kind === 'providers' || kind === 'locations') {
    return String(draft.name ?? '').trim()
  }
  return String(draft.title ?? '').trim()
}
