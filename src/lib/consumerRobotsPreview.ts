/**
 * Approximates fixer-client locality SEO robots (see `resolvePublicLocalityRobotsMetadata` in fixer-client).
 */
import { isPreferredServiceCategoryUrlSlug } from './serviceCatalogUrlSlugs'

const INDEXABLE_ROBOTS_LABEL =
  'index, follow (max-image-preview:large, max-snippet:-1, max-video-preview:-1)'

export type ConsumerRobotsPreview = {
  /** What Google should see after fixer-client merge (single directive). */
  effectiveLabel: string
  indexable: boolean
  tone: 'ok' | 'warn' | 'error'
  detail: string
  /** Raw CMS field on this key — may differ from effective. */
  cmsFieldLabel: string
}

function labelFromRobotsMeta(raw: string): { label: string; indexable: boolean } {
  const t = raw.trim().toLowerCase()
  if (!t) {
    return { label: INDEXABLE_ROBOTS_LABEL, indexable: true }
  }
  const indexable = !t.includes('noindex')
  return { label: raw.trim(), indexable }
}

export function resolveConsumerRobotsPreview(input: {
  isLocalityKey: boolean
  catalogStorageSlug: string
  localityRobotsMeta: string
  industryRobotsMeta?: string
}): ConsumerRobotsPreview {
  const cmsFieldLabel = input.localityRobotsMeta.trim() || '(empty — consumer default on this key)'
  const industryRobots = (input.industryRobotsMeta ?? '').trim()
  const localityHasNoindex = input.localityRobotsMeta.toLowerCase().includes('noindex')
  const industryHasNoindex = industryRobots.toLowerCase().includes('noindex')

  if (!input.isLocalityKey) {
    const parsed = labelFromRobotsMeta(input.localityRobotsMeta || industryRobots)
    return {
      effectiveLabel: parsed.label,
      indexable: parsed.indexable,
      tone: parsed.indexable ? 'ok' : 'warn',
      detail: parsed.indexable
        ? 'Industry-wide key — applies when locality rows leave robots empty (consumer merge).'
        : 'Industry key has noindex — can block locality pages that inherit this row.',
      cmsFieldLabel,
    }
  }

  const preferred = isPreferredServiceCategoryUrlSlug(input.catalogStorageSlug)
  if (!preferred) {
    const parsed = labelFromRobotsMeta(input.localityRobotsMeta)
    return {
      effectiveLabel: parsed.indexable ? parsed.label : 'noindex, follow',
      indexable: parsed.indexable,
      tone: 'warn',
      detail:
        'Non-canonical category alias — live site uses noindex + canonical to preferred slug (e.g. plumbing → plumber).',
      cmsFieldLabel,
    }
  }

  if (localityHasNoindex || industryHasNoindex) {
    return {
      effectiveLabel: INDEXABLE_ROBOTS_LABEL,
      indexable: true,
      tone: 'warn',
      detail:
        localityHasNoindex && industryHasNoindex
          ? 'CMS has noindex on this locality and the industry key. fixer-client still indexes canonical locality URLs — clear noindex here to avoid duplicate conflicting meta tags in HTML.'
          : localityHasNoindex
            ? 'CMS robots on this key contains noindex. fixer-client overrides to index for canonical locality URLs — update to the recommended string and Save.'
            : 'Industry key has noindex; locality pages still index on the live site. Clear noindex on the industry key to avoid confusion.',
      cmsFieldLabel,
    }
  }

  const parsed = labelFromRobotsMeta(input.localityRobotsMeta)
  return {
    effectiveLabel: parsed.label,
    indexable: true,
    tone: 'ok',
    detail: 'Canonical locality URL — matches sitemap and Search Console expectations.',
    cmsFieldLabel,
  }
}

export const PRODUCTION_INDEXABLE_ROBOTS_META =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
