import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Globe, MapPin, AlertTriangle, XCircle, ExternalLink, Siren, Navigation } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import {
  resolveSeoLandingFunnelUrls,
  resolveSeoLandingRoutingSlugs,
} from '../../lib/seoLandingRouting'
import { buildEmergencyCompositeSlug } from '../../lib/emergencyLandingSlugs'
import type { SeoLandingEntityKind } from '../../lib/seoLandingPageKinds'
import { publicUrlForKind } from '../../lib/seoLandingPageKinds'
import {
  validateSeoLandingForConsumer,
  type ConsumerIndexStatus,
} from '../../lib/seoLandingConsumerValidation'
import {
  effectiveSeoLandingMetaDescription,
  effectiveSeoLandingMetaTitle,
  resolveSeoLandingLocationLabel,
} from '../../lib/seoLandingEffectiveMeta'
import { buildCategoryMarketingNearMeEditUrl } from '../../lib/nearMeSeo'

const ORIGIN = 'https://www.profixer.in'

type Props = {
  kind: SeoLandingEntityKind
  draft: Record<string, unknown>
  slug: string
  catalogLabelMap: Record<string, string>
  catalogOptions?: readonly { value: string; label?: string }[]
  derivedServiceUrl?: string
  derivedNearMeUrl?: string
  derivedEmergencyUrl?: string
  emergencyIsPrimaryCategory?: boolean
  canMutate: boolean
  onPublish: () => void
  onSetNoindex: (value: boolean) => void
}

function statusVariant(status: ConsumerIndexStatus): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'publishable':
      return 'success'
    case 'blocked':
      return 'warning'
    default:
      return 'secondary'
  }
}

function StatusIcon({ status }: { status: ConsumerIndexStatus }) {
  if (status === 'publishable') return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
  if (status === 'blocked') return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
  return <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
}

/** Publish + local SEO workflow — aligned with consumer index gates. */
export function SeoLandingPublishPanel({
  kind,
  draft,
  slug,
  catalogLabelMap,
  catalogOptions = [],
  derivedServiceUrl: derivedServiceUrlProp,
  derivedNearMeUrl: derivedNearMeUrlProp,
  derivedEmergencyUrl: derivedEmergencyUrlProp,
  emergencyIsPrimaryCategory: emergencyIsPrimaryCategoryProp,
  canMutate,
  onPublish,
  onSetNoindex,
}: Props) {
  const validation = validateSeoLandingForConsumer(kind, draft)
  const funnel = resolveSeoLandingFunnelUrls(draft)
  const { serviceSlug } = resolveSeoLandingRoutingSlugs(draft)
  const derivedServiceUrl = derivedServiceUrlProp ?? funnel.booking
  const derivedNearMeUrl = derivedNearMeUrlProp ?? funnel.nearMe
  const derivedEmergencyUrl = derivedEmergencyUrlProp ?? funnel.emergency
  const emergencyIsPrimaryCategory = emergencyIsPrimaryCategoryProp ?? funnel.emergencyIsPrimaryCategory
  const livePath = slug ? publicUrlForKind(kind, slug, draft) : ''
  const liveUrl = livePath ? `${ORIGIN}${livePath}` : ''
  const categoryLabel = serviceSlug
    ? catalogLabelMap[serviceSlug] ?? serviceSlug.replace(/-/g, ' ')
    : ''
  const locationLabel = resolveSeoLandingLocationLabel(draft) ?? 'Mumbai (default)'
  const metaTitle = effectiveSeoLandingMetaTitle(kind, draft, catalogLabelMap)
  const metaDesc = effectiveSeoLandingMetaDescription(kind, draft, catalogLabelMap)
  const noindex = Boolean(
    draft.seo && typeof draft.seo === 'object' && (draft.seo as Record<string, unknown>).noindex,
  )

  const showLocalSeo =
    kind === 'problems' ||
    kind === 'cost-guides' ||
    kind === 'guides' ||
    kind === 'landing-pages' ||
    kind === 'emergency'

  const emergencyCmsKey =
    funnel.serviceSlug && funnel.locationSlug
      ? buildEmergencyCompositeSlug(funnel.serviceSlug, funnel.locationSlug)
      : ''

  const nearMeEditUrl =
    serviceSlug && derivedNearMeUrl
      ? buildCategoryMarketingNearMeEditUrl(serviceSlug, funnel.locationSlug, catalogOptions)
      : ''

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <StatusIcon status={validation.status} />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Publish & index status</h3>
              <Badge variant={statusVariant(validation.status)}>{validation.statusLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{validation.statusDetail}</p>
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {livePath}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {validation.status === 'publishable' ? (
            <Button type="button" size="sm" disabled={!canMutate} onClick={onPublish}>
              <Globe className="mr-1.5 h-4 w-4" aria-hidden />
              Publish to Google
            </Button>
          ) : validation.status === 'blocked' ? (
            <Button type="button" size="sm" variant="secondary" disabled={!canMutate} onClick={onPublish}>
              Enable indexing & save
            </Button>
          ) : null}
          {!noindex && validation.status === 'draft_noindex' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canMutate}
              onClick={() => onSetNoindex(true)}
            >
              Mark as draft
            </Button>
          ) : null}
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-foreground">
          {validation.errors.map((err) => (
            <li key={err} className="flex gap-2">
              <span className="text-amber-600">•</span>
              <span className={err.startsWith('FAQs:') ? 'text-muted-foreground' : undefined}>{err}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          All required consumer quality gates passed ({validation.wordCount.toLocaleString()} words).
        </p>
      )}

      {showLocalSeo ? (
        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Local SEO signals</p>
          </div>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Service category</dt>
              <dd className={cn('font-medium', !categoryLabel && 'text-amber-600')}>
                {categoryLabel || 'Not set — add in Setup'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Service area (schema)</dt>
              <dd className="font-medium">{locationLabel}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Live meta title</dt>
              <dd className="font-medium leading-snug">{metaTitle.value || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Live meta description</dt>
              <dd className="leading-snug text-muted-foreground">{metaDesc.value || '—'}</dd>
            </div>
            {derivedServiceUrl ? (
              <div>
                <dt className="text-muted-foreground">Booking funnel</dt>
                <dd>
                  <code className="text-foreground">{derivedServiceUrl}</code>
                </dd>
              </div>
            ) : null}
            {derivedNearMeUrl ? (
              <div>
                <dt className="text-muted-foreground">Near-me hub</dt>
                <dd>
                  <code className="text-foreground">{derivedNearMeUrl}</code>
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Emergency funnel</dt>
              <dd>
                {derivedEmergencyUrl ? (
                  <>
                    <code className="text-foreground">{derivedEmergencyUrl}</code>
                    {!emergencyIsPrimaryCategory ? (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        Dynamic emergency page — sitemap pre-builds AC, electrician, and plumber only. Link still
                        appears in related links on the live site.
                      </span>
                    ) : null}
                  </>
                ) : serviceSlug ? (
                  <span className="text-amber-600">
                    Pick a service area in Setup — emergency links need category + area (e.g.{' '}
                    <code className="text-foreground">/emergency/{funnel.preferredCategory || '…'}/mira-bhayandar</code>
                    )
                  </span>
                ) : (
                  <span className="text-amber-600">Set service category in Setup first</span>
                )}
              </dd>
            </div>
          </dl>
          {derivedNearMeUrl && nearMeEditUrl ? (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">
                  <Navigation className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
                  Near-me page content (Category Marketing)
                </p>
                <Link to={nearMeEditUrl} className="text-xs font-medium text-primary hover:underline">
                  Edit near-me content →
                </Link>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Intro, takeaways, and FAQs for <code>{derivedNearMeUrl}</code> live under Industry service pages →
                Near-me block{funnel.locationSlug ? ` (locality: ${funnel.locationSlug})` : ''}.
              </p>
            </div>
          ) : null}
          {kind !== 'emergency' && derivedEmergencyUrl && emergencyCmsKey ? (
            <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">
                  <Siren className="mr-1 inline h-3.5 w-3.5 text-red-600" aria-hidden />
                  Emergency landing page (separate content)
                </p>
                <Link
                  to={`/cms/seo-landing-pages?kind=emergency&page=${encodeURIComponent(emergencyCmsKey)}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit emergency page →
                </Link>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Urgent-intent copy lives on <code>{derivedEmergencyUrl}</code> — not on this problem/charges page.
              </p>
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            Google uses category + area for Service / LocalBusiness JSON-LD. Pick a specific area when targeting
            &ldquo;near me&rdquo; queries — otherwise Mumbai defaults in schema. Emergency URLs surface in the
            &ldquo;Emergency service&rdquo; related-links block when category and area are set.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default SeoLandingPublishPanel
