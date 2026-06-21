import {
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
} from '../components/blog/blog-seo-guidelines'
import {
  estimateSeoLandingWordCount,
  SEO_LANDING_MIN_INTERNAL_LINKS,
  SEO_LANDING_MIN_WORDS,
  SEO_LANDING_OPTIMAL_WORDS,
  type SeoLandingEntityKind,
} from './seoLandingPageKinds'
import { isValidSeoLandingSlug } from './seoLandingSlug'

export type SeoLandingEditorTab = 'setup' | 'content' | 'links' | 'seo'

export type SeoLandingQualityItem = {
  id: string
  group: 'Setup' | 'Content' | 'Links' | 'SEO'
  label: string
  ok: boolean
  detail: string
  priority: 'required' | 'recommended'
  tab: SeoLandingEditorTab
}

export type SeoLandingQualityReport = {
  score: number
  statusLabel: 'Not started' | 'Draft' | 'Needs work' | 'Nearly ready' | 'Publish ready'
  statusVariant: 'secondary' | 'warning' | 'info' | 'success'
  items: SeoLandingQualityItem[]
  passed: number
  total: number
  requiredPassed: number
  requiredTotal: number
  wordCount: number
}

const stripHtml = (s?: string) => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

function seoObj(draft: Record<string, unknown>): Record<string, unknown> {
  const seo = draft.seo
  return seo && typeof seo === 'object' ? (seo as Record<string, unknown>) : {}
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

function countInternalLinks(draft: Record<string, unknown>): number {
  if (!Array.isArray(draft.relatedLinks)) return 0
  return draft.relatedLinks.filter((row) => {
    if (!row || typeof row !== 'object') return false
    const o = row as Record<string, unknown>
    return Boolean(String(o.label ?? '').trim() && String(o.url ?? o.href ?? '').trim())
  }).length
}

function sectionCount(draft: Record<string, unknown>): number {
  return Array.isArray(draft.sections) ? draft.sections.length : 0
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

function hasHowToContent(draft: Record<string, unknown>): boolean {
  if (Array.isArray(draft.howToSteps) && draft.howToSteps.length > 0) return true
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  return sections.some((s) => {
    if (!s || typeof s !== 'object') return false
    const sec = s as Record<string, unknown>
    return sec.type === 'how_to' && Array.isArray(sec.steps) && sec.steps.length > 0
  })
}

function hasCausesContent(draft: Record<string, unknown>): boolean {
  const sections = Array.isArray(draft.sections) ? draft.sections : []
  return sections.some((s) => {
    if (!s || typeof s !== 'object') return false
    const sec = s as Record<string, unknown>
    return sec.type === 'causes' && Array.isArray(sec.causes) && sec.causes.length > 0
  })
}

export function effectiveSeoLandingMetaTitle(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): { value: string; source: 'seo' | 'page' | 'name' | 'empty' } {
  const custom = String(seoObj(draft).title ?? '').trim()
  if (custom) return { value: custom, source: 'seo' }
  if (kind === 'providers') {
    const name = String(draft.name ?? '').trim()
    return name ? { value: `${name} | ProFixer`, source: 'name' } : { value: '', source: 'empty' }
  }
  const title = String(draft.title ?? '').trim()
  return title ? { value: `${title} | ProFixer`, source: 'page' } : { value: '', source: 'empty' }
}

export function effectiveSeoLandingMetaDescription(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): { value: string; source: 'seo' | 'quickAnswer' | 'bio' | 'empty' } {
  const custom = String(seoObj(draft).description ?? '').trim()
  if (custom) return { value: custom, source: 'seo' }
  if (kind === 'providers') {
    const bio = stripHtml(String(draft.bio ?? ''))
    return bio ? { value: bio, source: 'bio' } : { value: '', source: 'empty' }
  }
  const qa = stripHtml(String(draft.quickAnswer ?? ''))
  return qa ? { value: qa, source: 'quickAnswer' } : { value: '', source: 'empty' }
}

function item(
  partial: Omit<SeoLandingQualityItem, 'ok'> & { ok: boolean },
): SeoLandingQualityItem {
  return partial
}

export function buildSeoLandingQualityReport(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): SeoLandingQualityReport {
  const items: SeoLandingQualityItem[] = []
  const slug = String(draft.slug ?? '').trim()
  const wordCount = estimateSeoLandingWordCount(kind, draft)
  const faqs = countFaqs(draft)
  const links = countInternalLinks(draft)
  const takeaways = takeawayCount(draft)
  const sections = sectionCount(draft)
  const prices = priceRowCount(draft)
  const metaTitle = effectiveSeoLandingMetaTitle(kind, draft)
  const metaDesc = effectiveSeoLandingMetaDescription(kind, draft)
  const titleLen = metaTitle.value.length
  const descLen = metaDesc.value.length
  const noindex = Boolean(seoObj(draft).noindex)

  items.push(
    item({
      id: 'slug',
      group: 'Setup',
      label: 'URL slug',
      ok: Boolean(slug && isValidSeoLandingSlug(slug)),
      detail: slug ? `/${slug}` : 'Set a valid slug in Setup',
      priority: 'required',
      tab: 'setup',
    }),
  )

  if (kind === 'providers') {
    const name = String(draft.name ?? '').trim()
    const bioLen = stripHtml(String(draft.bio ?? '')).length
    items.push(
      item({
        id: 'name',
        group: 'Setup',
        label: 'Provider name',
        ok: name.length > 0,
        detail: name || 'Add display name',
        priority: 'required',
        tab: 'setup',
      }),
      item({
        id: 'services',
        group: 'Setup',
        label: 'Services offered',
        ok: Array.isArray(draft.servicesOffered) && draft.servicesOffered.length > 0,
        detail: 'Pick at least one catalog category',
        priority: 'required',
        tab: 'setup',
      }),
      item({
        id: 'areas',
        group: 'Setup',
        label: 'Areas served',
        ok: Array.isArray(draft.areasServed) && draft.areasServed.length > 0,
        detail: 'Pick service areas from catalog',
        priority: 'required',
        tab: 'setup',
      }),
      item({
        id: 'bio',
        group: 'Content',
        label: 'Bio / experience',
        ok: bioLen >= 80,
        detail: bioLen >= 80 ? `${bioLen} chars` : `${bioLen}/80 chars minimum`,
        priority: 'required',
        tab: 'content',
      }),
    )
  } else if (kind === 'locations') {
    const name = String(draft.name ?? '').trim()
    const qaLen = stripHtml(String(draft.quickAnswer ?? '')).length
    const neighbours = Array.isArray(draft.neighbours) ? draft.neighbours.length : 0
    items.push(
      item({
        id: 'area-name',
        group: 'Setup',
        label: 'Area display name',
        ok: name.length > 0,
        detail: name || 'Synced from Service areas picker',
        priority: 'required',
        tab: 'setup',
      }),
      item({
        id: 'quick-answer',
        group: 'Content',
        label: 'Quick answer',
        ok: qaLen >= 40,
        detail: qaLen >= 40 ? `${qaLen} chars` : `${qaLen}/40 chars (required to index)`,
        priority: 'required',
        tab: 'content',
      }),
      item({
        id: 'neighbours',
        group: 'Links',
        label: 'Neighbour areas',
        ok: neighbours >= 2,
        detail: neighbours >= 2 ? `${neighbours} linked areas` : `${neighbours}/2 recommended for local hub`,
        priority: 'recommended',
        tab: 'setup',
      }),
    )
  } else {
    const title = String(draft.title ?? '').trim()
    items.push(
      item({
        id: 'title',
        group: 'Setup',
        label: 'Page title (H1)',
        ok: title.length >= 10,
        detail: title ? `${title.length} chars` : 'Add a descriptive headline',
        priority: 'required',
        tab: 'setup',
      }),
    )

    if (kind === 'problems' || kind === 'cost-guides' || kind === 'guides' || kind === 'landing-pages') {
      const serviceSlug = String(draft.serviceSlug ?? '').trim()
      items.push(
        item({
          id: 'category',
          group: 'Setup',
          label: 'Service category',
          ok: serviceSlug.length > 0,
          detail: serviceSlug || 'Pick from Categories catalog',
          priority: 'required',
          tab: 'setup',
        }),
      )
    }

    if (kind === 'landing-pages') {
      const loc = String(draft.locationSlug ?? '').trim()
      items.push(
        item({
          id: 'locality',
          group: 'Setup',
          label: 'Service area',
          ok: loc.length > 0,
          detail: loc || 'Required for local money pages',
          priority: 'required',
          tab: 'setup',
        }),
      )
    }

    if (kind === 'cost-guides') {
      items.push(
        item({
          id: 'year',
          group: 'Setup',
          label: 'Price guide year',
          ok: Boolean(draft.year),
          detail: draft.year ? String(draft.year) : 'Set year for freshness',
          priority: 'required',
          tab: 'setup',
        }),
      )
    }

    const qaLen = stripHtml(String(draft.quickAnswer ?? '')).length
    items.push(
      item({
        id: 'quick-answer',
        group: 'Content',
        label: 'Quick answer',
        ok: qaLen >= 40,
        detail: qaLen >= 40 ? `${qaLen} chars` : `${qaLen}/40 chars (required to index)`,
        priority: 'required',
        tab: 'content',
      }),
    )

    if (kind !== 'locations') {
      items.push(
        item({
          id: 'takeaways',
          group: 'Content',
          label: 'Key takeaways',
          ok: takeaways >= 3,
          detail: takeaways >= 3 ? `${takeaways} bullets` : `${takeaways}/3 recommended for AI Overviews`,
          priority: 'recommended',
          tab: 'content',
        }),
      )
    }

    items.push(
      item({
        id: 'sections',
        group: 'Content',
        label: 'Content sections',
        ok: sections >= 2,
        detail: sections >= 2 ? `${sections} blocks` : `${sections}/2+ sections for depth`,
        priority: 'recommended',
        tab: 'content',
      }),
    )

    if (kind === 'problems') {
      items.push(
        item({
          id: 'causes',
          group: 'Content',
          label: 'Causes & fixes block',
          ok: hasCausesContent(draft),
          detail: hasCausesContent(draft) ? 'Present' : 'Add a Causes section for problem intent',
          priority: 'recommended',
          tab: 'content',
        }),
      )
    }

    if (kind === 'guides') {
      items.push(
        item({
          id: 'howto',
          group: 'Content',
          label: 'How-to steps',
          ok: hasHowToContent(draft),
          detail: hasHowToContent(draft) ? 'Present (HowTo schema)' : 'Add How-to steps for guide pages',
          priority: 'required',
          tab: 'content',
        }),
      )
    }

    if (kind === 'cost-guides' || kind === 'landing-pages') {
      items.push(
        item({
          id: 'prices',
          group: 'Content',
          label: 'Price table',
          ok: prices >= 3,
          detail: prices >= 3 ? `${prices} rows` : `${prices}/3+ price rows recommended`,
          priority: kind === 'cost-guides' ? 'required' : 'recommended',
          tab: 'content',
        }),
      )
    } else if (kind === 'problems' || kind === 'guides') {
      items.push(
        item({
          id: 'prices',
          group: 'Content',
          label: 'Price guide',
          ok: prices >= 3,
          detail:
            prices >= 3
              ? `${prices} charge rows`
              : `${prices}/3+ — import from platform catalog in Content tab`,
          priority: 'recommended',
          tab: 'content',
        }),
      )
    }

    items.push(
      item({
        id: 'faqs',
        group: 'Content',
        label: 'FAQs',
        ok: faqs >= 3,
        detail: faqs >= 3 ? `${faqs} Q&As` : `${faqs}/3+ for FAQ rich results`,
        priority: 'recommended',
        tab: 'content',
      }),
    )
  }

  items.push(
    item({
      id: 'word-count',
      group: 'Content',
      label: 'Word count',
      ok: wordCount >= SEO_LANDING_MIN_WORDS,
      detail:
        wordCount >= SEO_LANDING_OPTIMAL_WORDS
          ? `${wordCount} words (optimal)`
          : wordCount >= SEO_LANDING_MIN_WORDS
            ? `${wordCount} words — aim for ${SEO_LANDING_OPTIMAL_WORDS}+`
            : `${wordCount}/${SEO_LANDING_MIN_WORDS} minimum`,
      priority: 'required',
      tab: 'content',
    }),
    item({
      id: 'internal-links',
      group: 'Links',
      label: 'Internal links',
      ok: links >= SEO_LANDING_MIN_INTERNAL_LINKS,
      detail:
        links >= SEO_LANDING_MIN_INTERNAL_LINKS
          ? `${links} editorial links`
          : `${links}/${SEO_LANDING_MIN_INTERNAL_LINKS} contextual links`,
      priority: 'required',
      tab: 'links',
    }),
    item({
      id: 'meta-title',
      group: 'SEO',
      label: 'Meta title',
      ok:
        titleLen >= SEO_TITLE_MIN_CHARS &&
        titleLen <= SEO_TITLE_OPTIMAL_MAX_CHARS &&
        metaTitle.source !== 'empty',
      detail: metaTitle.source === 'empty'
        ? 'Add page title or custom SEO title'
        : metaTitle.source !== 'seo'
          ? `Auto from ${metaTitle.source === 'page' ? 'H1' : 'name'} · ${titleLen} chars — custom SEO title recommended`
          : titleLen >= SEO_TITLE_MIN_CHARS && titleLen <= SEO_TITLE_OPTIMAL_MAX_CHARS
            ? `${titleLen} chars (optimal band)`
            : `${titleLen} chars — aim ${SEO_TITLE_MIN_CHARS}–${SEO_TITLE_OPTIMAL_MAX_CHARS}`,
      priority: metaTitle.source === 'seo' ? 'required' : 'recommended',
      tab: 'seo',
    }),
    item({
      id: 'meta-desc',
      group: 'SEO',
      label: 'Meta description',
      ok: descLen >= META_DESC_MIN_CHARS && descLen <= META_DESC_OPTIMAL_MAX_CHARS,
      detail: descLen === 0
        ? 'Add meta description or fill quick answer'
        : metaDesc.source !== 'seo'
          ? `Auto from quick answer · ${descLen} chars — tailor for SERP`
          : descLen >= META_DESC_MIN_CHARS && descLen <= META_DESC_OPTIMAL_MAX_CHARS
            ? `${descLen} chars (optimal band)`
            : `${descLen} chars — aim ${META_DESC_MIN_CHARS}–${META_DESC_OPTIMAL_MAX_CHARS}`,
      priority: metaDesc.source === 'seo' ? 'required' : 'recommended',
      tab: 'seo',
    }),
    item({
      id: 'indexable',
      group: 'SEO',
      label: 'Indexable (no noindex)',
      ok: !noindex,
      detail: noindex ? 'Noindex is on — page stays out of Google' : 'Eligible for sitemap when gates pass',
      priority: 'required',
      tab: 'seo',
    }),
  )

  if (kind === 'landing-pages') {
    const canonical = String(seoObj(draft).canonicalPath ?? '').trim()
    items.push(
      item({
        id: 'canonical',
        group: 'SEO',
        label: 'Canonical URL',
        ok: canonical.length > 0,
        detail: canonical || 'Set if this page overlaps /services/… (avoid duplicate indexing)',
        priority: 'recommended',
        tab: 'seo',
      }),
    )
  }

  const passed = items.filter((i) => i.ok).length
  const total = items.length
  const requiredItems = items.filter((i) => i.priority === 'required')
  const requiredPassed = requiredItems.filter((i) => i.ok).length
  const requiredTotal = requiredItems.length

  const requiredScore = requiredTotal > 0 ? (requiredPassed / requiredTotal) * 100 : 0
  const recommendedItems = items.filter((i) => i.priority === 'recommended')
  const recommendedPassed = recommendedItems.filter((i) => i.ok).length
  const recommendedScore =
    recommendedItems.length > 0 ? (recommendedPassed / recommendedItems.length) * 100 : 100
  const score = Math.round(requiredScore * 0.7 + recommendedScore * 0.3)

  let statusLabel: SeoLandingQualityReport['statusLabel'] = 'Draft'
  let statusVariant: SeoLandingQualityReport['statusVariant'] = 'secondary'

  if (passed === 0) {
    statusLabel = 'Not started'
    statusVariant = 'secondary'
  } else if (requiredPassed < requiredTotal) {
    statusLabel = 'Needs work'
    statusVariant = 'warning'
  } else if (score >= 90 && !noindex) {
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
    wordCount,
  }
}

/** Lightweight status for page list sidebar. */
export function quickSeoLandingPageStatus(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
): SeoLandingQualityReport['statusVariant'] {
  return buildSeoLandingQualityReport(kind, draft).statusVariant
}
