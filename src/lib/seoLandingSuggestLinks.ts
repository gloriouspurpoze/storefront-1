import type { InternalLinkRow } from '../components/cms/SeoLandingInternalLinksEditor'
import { buildNearMeCategoryPublicPath, buildNearMeLocalityPublicPath } from './nearMeSeo'
import {
  buildServiceLocalityPublicPath,
  getPreferredServiceCategoryUrlSlug,
} from './serviceCatalogUrlSlugs'
import type { SeoLandingEntityKind } from './seoLandingPageKinds'

function formatCategoryLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function titleCaseArea(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Starter internal links from category, location, and page type. */
export function suggestSeoLandingInternalLinks(
  kind: SeoLandingEntityKind,
  draft: Record<string, unknown>,
  catalogLabels?: Record<string, string>,
): InternalLinkRow[] {
  const links: InternalLinkRow[] = []
  const serviceSlug = String(
    draft.serviceSlug ??
      (Array.isArray(draft.servicesOffered) ? draft.servicesOffered[0] : '') ??
      '',
  ).trim()
  const locationSlug = String(
    draft.locationSlug ??
      (Array.isArray(draft.areasServed) ? draft.areasServed[0] : '') ??
      (kind === 'locations' ? draft.slug : '') ??
      '',
  )
    .trim()
    .toLowerCase()
  const locationName = String(draft.locationName ?? draft.name ?? '').trim()
  const locLabel = locationName || titleCaseArea(locationSlug)
  const catLabel = (serviceSlug && catalogLabels?.[serviceSlug]) || formatCategoryLabel(serviceSlug)
  const pageSlug = String(draft.slug ?? '').trim()

  if (serviceSlug && locationSlug) {
    links.push({
      label: `${catLabel} in ${locLabel}`,
      url: buildServiceLocalityPublicPath(serviceSlug, locationSlug),
    })
    links.push({
      label: `${catLabel.toLowerCase()} near me in ${locLabel}`,
      url: buildNearMeLocalityPublicPath(serviceSlug, locationSlug),
    })
  }

  if (serviceSlug) {
    links.push({
      label: `${catLabel} near me`,
      url: buildNearMeCategoryPublicPath(serviceSlug),
    })
    const pref = getPreferredServiceCategoryUrlSlug(serviceSlug)
    links.push({
      label: `${catLabel} services`,
      url: `/services/${pref}`,
    })
  }

  if (locationSlug && kind !== 'locations') {
    links.push({
      label: `Home services in ${locLabel}`,
      url: `/areas/${locationSlug}`,
    })
  }

  if (kind === 'locations' && pageSlug) {
    if (serviceSlug) {
      links.push({
        label: `Book ${catLabel} in ${locLabel}`,
        url: buildServiceLocalityPublicPath(serviceSlug, pageSlug),
      })
    }
    if (Array.isArray(draft.neighbours)) {
      for (const n of draft.neighbours.slice(0, 2)) {
        const nslug = String(n).trim().toLowerCase()
        if (!nslug) continue
        links.push({
          label: `Home services in ${titleCaseArea(nslug)}`,
          url: `/areas/${nslug}`,
        })
      }
    }
  }

  if (kind === 'problems' && serviceSlug && locationSlug) {
    links.push({
      label: `${catLabel} charges in ${locLabel}`,
      url: `/charges/${serviceSlug}-cost-${locationSlug}`,
    })
  }

  if (kind === 'cost-guides' && serviceSlug && pageSlug) {
    links.push({
      label: `${catLabel} troubleshooting`,
      url: `/problems/${serviceSlug}-not-cooling`,
    })
  }

  if (kind === 'guides' && serviceSlug) {
    links.push({
      label: `Common ${catLabel.toLowerCase()} problems`,
      url: `/problems/${serviceSlug}-not-working`,
    })
  }

  if (kind === 'providers' && serviceSlug && locationSlug) {
    links.push({
      label: `Book ${catLabel} in ${locLabel}`,
      url: buildServiceLocalityPublicPath(serviceSlug, locationSlug),
    })
  }

  if (kind === 'landing-pages' && serviceSlug && locationSlug) {
    links.push({
      label: `${catLabel} charges in ${locLabel}`,
      url: `/charges/${serviceSlug}-cost-${locationSlug}`,
    })
  }

  const seen = new Set<string>()
  return links.filter((l) => {
    const url = l.url.trim()
    const label = l.label.trim()
    if (!url || !label || seen.has(url)) return false
    seen.add(url)
    return true
  })
}

/** Merge suggestions with existing rows (existing wins on URL collision). */
export function mergeSuggestedInternalLinks(
  existing: unknown,
  suggested: InternalLinkRow[],
): InternalLinkRow[] {
  const current = Array.isArray(existing)
    ? existing.map((row) => {
        if (!row || typeof row !== 'object') return { label: '', url: '' }
        const o = row as Record<string, unknown>
        return {
          label: String(o.label ?? '').trim(),
          url: String(o.url ?? o.href ?? '').trim(),
        }
      })
    : []
  const urls = new Set(current.map((r) => r.url).filter(Boolean))
  const merged = [...current.filter((r) => r.label || r.url)]
  for (const row of suggested) {
    if (!urls.has(row.url)) {
      merged.push(row)
      urls.add(row.url)
    }
  }
  return merged
}
