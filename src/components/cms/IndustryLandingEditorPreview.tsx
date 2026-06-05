import React, { useMemo, useState } from 'react'
import { Eye, Copy, Check, Monitor, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type { CategoryMarketingConfig } from '../../types/categoryMarketing'
import { mergeCategoryConfig } from '../../types/categoryMarketing'
import {
  SERP_SNIPPET_PREVIEW_CHARS,
  SERP_TITLE_PREVIEW_CHARS,
} from '../blog/blog-seo-guidelines'
import {
  buildIndustryLandingPreviewJsonLd,
  resolveIndustryLandingPreviewUrl,
} from '../../lib/buildIndustryLandingPreviewJsonLd'
import { resolveConsumerRobotsPreview } from '../../lib/consumerRobotsPreview'
import { CmsConsumerVisualPreview, ConsumerPreviewRichHtml } from './CmsConsumerVisualPreview'

function PreviewRichHtml({ html, className }: { html: string; className?: string }) {
  return <ConsumerPreviewRichHtml html={html} className={className} />
}

export interface IndustryLandingEditorPreviewProps {
  config: CategoryMarketingConfig
  effectiveKey: string
  industryLabel: string
  localityDisplayLabel: string
  className?: string
  /** Public origin without trailing slash — SERP URL + JSON-LD `@id` hints */
  publicOrigin?: string
  /** CMS storage slug for the industry row (e.g. `electric` → public `electrician`). */
  catalogStorageSlug?: string
  /** Industry-wide robots string — used to explain consumer merge on locality keys. */
  industryRobotsMeta?: string
}

function pickSeoTitle(cfg: CategoryMarketingConfig): string {
  return cfg.seoTitle.trim()
}

function pickMetaDesc(cfg: CategoryMarketingConfig): string {
  return cfg.metaDescription.replace(/\s+/g, ' ').trim()
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function serpBlock(cfg: CategoryMarketingConfig, pageUrl: string) {
  const rawTitle = pickSeoTitle(cfg)
  const titleShown =
    rawTitle.length === 0
      ? 'Add SEO title — shown in search results'
      : truncate(rawTitle, SERP_TITLE_PREVIEW_CHARS)
  const rawSnip = pickMetaDesc(cfg)
  const snipShown =
    rawSnip.length === 0
      ? 'Add meta description — often used as the snippet under the blue link.'
      : truncate(rawSnip, SERP_SNIPPET_PREVIEW_CHARS)
  return { pageUrl, titleShown, snipShown, titleLen: rawTitle.length, snipLen: rawSnip.length }
}

export function IndustryLandingEditorPreview({
  config,
  effectiveKey,
  industryLabel,
  localityDisplayLabel,
  className,
  publicOrigin: publicOriginProp,
  catalogStorageSlug,
  industryRobotsMeta = '',
}: IndustryLandingEditorPreviewProps) {
  const publicOrigin = (publicOriginProp || process.env.REACT_APP_PUBLIC_SITE_ORIGIN || 'https://www.profixer.in/blog').replace(
    /\/$/,
    '',
  )
  const merged = useMemo(() => mergeCategoryConfig(config), [config])
  const pageUrl = useMemo(
    () => resolveIndustryLandingPreviewUrl(merged, effectiveKey, publicOrigin),
    [merged, effectiveKey, publicOrigin],
  )
  const serp = useMemo(() => serpBlock(merged, pageUrl), [merged, pageUrl])
  const jsonLdPreview = useMemo(
    () => buildIndustryLandingPreviewJsonLd(merged, effectiveKey, publicOrigin),
    [merged, effectiveKey, publicOrigin],
  )
  const jsonLdString = useMemo(() => JSON.stringify(jsonLdPreview.document, null, 2), [jsonLdPreview.document])

  const [copied, setCopied] = useState(false)
  const [visualViewport, setVisualViewport] = useState<'desktop' | 'mobile'>('desktop')
  const copyJson = () => {
    void navigator.clipboard.writeText(jsonLdString).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const ogTitle = merged.technicalSeo.ogTitle.trim() || merged.seoTitle.trim() || '—'
  const ogDesc = merged.technicalSeo.ogDescription.trim() || merged.metaDescription.trim() || '—'
  const ogImage = merged.localSeo.ogImageOverride.trim()
  const ogType = merged.technicalSeo.ogType.trim() || 'website'
  const isLocalityKey = effectiveKey.includes('__')
  const robotsPreview = useMemo(
    () =>
      resolveConsumerRobotsPreview({
        isLocalityKey,
        catalogStorageSlug: catalogStorageSlug ?? (isLocalityKey ? effectiveKey.split('__')[0]! : effectiveKey),
        localityRobotsMeta: merged.technicalSeo.robotsMeta,
        industryRobotsMeta,
      }),
    [catalogStorageSlug, effectiveKey, industryRobotsMeta, isLocalityKey, merged.technicalSeo.robotsMeta],
  )
  const hreflangCount = merged.technicalSeo.hreflangAlternates.filter(
    (h) => h.hreflang.trim() && h.href.trim(),
  ).length

  const twCard = merged.technicalSeo.twitterCard || 'summary_large_image'

  return (
    <Card className={cn('overflow-hidden border-border/80 shadow-sm', className)}>
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Live preview</CardTitle>
              <CardDescription className="mt-1">
                Editorial approximation for <span className="font-medium text-foreground">{industryLabel}</span>
                {localityDisplayLabel !== 'All areas (default)' ? (
                  <>
                    {' '}
                    · <span className="font-medium text-foreground">{localityDisplayLabel}</span>
                  </>
                ) : null}
                . Public HTML/merge rules on the consumer app may differ slightly.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 font-mono text-[11px]">
            {effectiveKey}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="serp" className="w-full">
          <TabsList className="mb-3 flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="serp" className="text-xs sm:text-sm">
              SERP &amp; meta tags
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm">
              Open Graph / Twitter
            </TabsTrigger>
            <TabsTrigger value="jsonld" className="text-xs sm:text-sm">
              JSON-LD (approx.)
            </TabsTrigger>
            <TabsTrigger value="visual" className="text-xs sm:text-sm">
              Visual page
            </TabsTrigger>
            <TabsTrigger value="outline" className="text-xs sm:text-sm">
              Content outline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-0 space-y-3 outline-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Approximate consumer layout — fonts and spacing may differ slightly on profixer.in.
              </p>
              <div className="flex gap-1 rounded-md border border-border/60 p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={visualViewport === 'desktop' ? 'default' : 'ghost'}
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={() => setVisualViewport('desktop')}
                >
                  <Monitor className="h-3.5 w-3.5" aria-hidden />
                  Desktop
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={visualViewport === 'mobile' ? 'default' : 'ghost'}
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={() => setVisualViewport('mobile')}
                >
                  <Smartphone className="h-3.5 w-3.5" aria-hidden />
                  Mobile
                </Button>
              </div>
            </div>
            <CmsConsumerVisualPreview config={merged} viewport={visualViewport} />
          </TabsContent>

          <TabsContent value="serp" className="mt-0 space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Google-style snippet
                </p>
                <div className="rounded-lg border border-border/80 bg-background p-3 shadow-sm">
                  <div className="text-base leading-snug text-[#1a0dab] dark:text-primary">{serp.titleShown}</div>
                  <div className="mt-1 break-all text-xs leading-snug text-[#006621] dark:text-storm-deep/90">
                    {serp.pageUrl}
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-[#4d5156] dark:text-muted-foreground">
                    {serp.snipShown}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    ~{serp.titleLen} title chars · ~{serp.snipLen} meta chars (truncation is UI-only).
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Head &amp; discovery hints
                </p>
                <dl className="space-y-2 rounded-lg border border-border/70 bg-muted/15 p-3 text-xs">
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">&lt;title&gt;</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words">{pickSeoTitle(merged) || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">&lt;meta name=&quot;description&quot;&gt;</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words">{pickMetaDesc(merged) || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">link rel=&quot;canonical&quot;</dt>
                    <dd className="mt-0.5 break-all font-mono text-[11px]">
                      {merged.technicalSeo.canonicalUrl.trim() || `→ ${pageUrl} (fallback from slug / key)`}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">meta name=&quot;robots&quot; (live site)</dt>
                    <dd className="mt-0.5 break-words font-medium text-foreground">{robotsPreview.effectiveLabel}</dd>
                    <dd className="mt-1.5 text-[11px] text-muted-foreground">
                      CMS field on this key: {robotsPreview.cmsFieldLabel}
                    </dd>
                    <dd
                      className={cn(
                        'mt-1 text-[11px]',
                        robotsPreview.tone === 'ok' && 'text-storm-deep dark:text-storm-sea',
                        robotsPreview.tone === 'warn' && 'text-bloom-coral dark:text-bloom-coral',
                        robotsPreview.tone === 'error' && 'text-destructive',
                      )}
                    >
                      {robotsPreview.detail}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">hreflang</dt>
                    <dd className="mt-0.5">
                      {hreflangCount ? `${hreflangCount} alternate link(s) configured` : 'None configured'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">Primary keyword</dt>
                    <dd className="mt-0.5">{merged.primaryKeyword.trim() || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border/80 bg-muted/10 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Open Graph (share card)
                </p>
                <div className="overflow-hidden rounded-md border border-border/60 bg-card shadow-sm">
                  {ogImage ? (
                    <div className="aspect-[1.91/1] w-full bg-muted">
                      <img
                        src={ogImage}
                        alt={merged.technicalSeo.ogImageAlt.trim() || 'Open Graph preview image'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-xs text-muted-foreground">
                      No og:image (Local SEO → Social preview URL)
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">{ogType}</div>
                    <div className="line-clamp-2 text-sm font-semibold leading-snug">{ogTitle}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{ogDesc}</div>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 font-mono text-muted-foreground">og:image:alt</dt>
                    <dd className="min-w-0 break-words">{merged.technicalSeo.ogImageAlt.trim() || '—'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Twitter</p>
                <dl className="space-y-2 rounded-lg border border-border/70 bg-muted/15 p-3 text-xs">
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">twitter:card</dt>
                    <dd className="mt-0.5">{twCard}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">twitter:site</dt>
                    <dd className="mt-0.5">{merged.technicalSeo.twitterSite.trim() ? `@${merged.technicalSeo.twitterSite.trim()}` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">twitter:creator</dt>
                    <dd className="mt-0.5">
                      {merged.technicalSeo.twitterCreator.trim()
                        ? `@${merged.technicalSeo.twitterCreator.trim()}`
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted-foreground">Answer-engine summary</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">
                      {merged.technicalSeo.answerEngineSummary.trim() || '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jsonld" className="mt-0 space-y-3 outline-none">
            <ul className="list-inside list-disc space-y-1 text-[11px] text-muted-foreground">
              {jsonLdPreview.footnotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyJson}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied' : 'Copy JSON-LD'}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {jsonLdPreview.document['@graph'].length} node(s) in @graph
              </span>
            </div>
            <pre className="max-h-[min(420px,45vh)] overflow-auto rounded-md border border-border/80 bg-ink p-3 text-[11px] leading-relaxed text-fog dark:bg-black/80">
              {jsonLdString}
            </pre>
            {jsonLdPreview.jsonLdExtraParsed != null ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Extra JSON-LD field (parsed)</p>
                <pre className="max-h-48 overflow-auto rounded-md border border-bloom-coral/60 bg-bloom-rose/40 p-2 text-[11px] text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/30 dark:text-bloom-deep">
                  {JSON.stringify(jsonLdPreview.jsonLdExtraParsed, null, 2)}
                </pre>
              </div>
            ) : merged.jsonLdExtra.trim() ? (
              <p className="text-xs text-destructive">Extra JSON-LD is not valid JSON — fix in the closing / JSON-LD tab.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="outline" className="mt-0 outline-none">
            <div className="max-h-[min(520px,55vh)] space-y-6 overflow-y-auto pr-1 text-sm">
              <PreviewSection title="Hero" kicker="H1 + intro">
                <PreviewH1 text={merged.mainHeading.trim() || '— (Hero tab)'} />
                {merged.heroTrustBadge.trim() ? <PreviewP kicker="Trust pill">{merged.heroTrustBadge}</PreviewP> : null}
                {merged.heroChip.trim() ? <PreviewP kicker="Chip">{merged.heroChip}</PreviewP> : null}
                {merged.heroProofPoints.filter((x) => x.trim()).length ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                    {merged.heroProofPoints.filter((x) => x.trim()).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : null}
                {merged.topicChips.filter((x) => x.trim()).length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {merged.topicChips
                      .filter((x) => x.trim())
                      .map((x, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {x}
                        </Badge>
                      ))}
                  </div>
                ) : null}
                {merged.intro.trim() ? (
                  <div className="mt-2">
                    <PreviewRichHtml html={merged.intro} />
                  </div>
                ) : null}
                {merged.introLeadMagnetLabel.trim() ? (
                  <p className="mt-2 text-xs">
                    <span className="text-muted-foreground">Lead magnet: </span>
                    <span className="font-medium">{merged.introLeadMagnetLabel}</span>
                    {merged.introLeadMagnetUrl.trim() ? (
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">({merged.introLeadMagnetUrl})</span>
                    ) : null}
                  </p>
                ) : null}
              </PreviewSection>

              <PreviewSection title="Service cards" kicker={String(merged.serviceCards.length)}>
                {merged.serviceCards.some((c) => c.title.trim()) ? (
                  <ul className="list-inside list-decimal space-y-2 text-xs text-muted-foreground">
                    {merged.serviceCards
                      .filter((c) => c.title.trim())
                      .map((c, i) => (
                        <li key={i} className="list-item">
                          <span className="font-medium text-foreground">{c.title}</span>
                          {c.description.trim() ? (
                            <div className="mt-0.5 font-normal">
                              <PreviewRichHtml html={c.description} />
                            </div>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No card titles</p>
                )}
              </PreviewSection>

              <PreviewSection title="Service types" kicker="H2 blocks">
                {merged.serviceTypes.some((t) => t.title.trim()) ? (
                  <div className="space-y-3">
                    {merged.serviceTypes
                      .filter((t) => t.title.trim())
                      .map((t, i) => (
                        <div key={i}>
                          <PreviewH2 text={t.title} />
                          {t.description.trim() ? (
                            <div className="mt-1">
                              <PreviewRichHtml html={t.description} />
                            </div>
                          ) : null}
                          {t.bullets.filter((b) => b.trim()).length ? (
                            <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                              {t.bullets.filter((b) => b.trim()).map((b, j) => (
                                <li key={j}>{b}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">None</p>
                )}
              </PreviewSection>

              <PreviewSection title="Trust & ways">
                {merged.trustBenefits.some((b) => b.heading.trim()) ? (
                  <div className="mb-2 space-y-2 text-xs">
                    {merged.trustBenefits
                      .filter((b) => b.heading.trim())
                      .map((b, i) => (
                        <div key={i}>
                          <div className="font-medium text-foreground">{b.heading}</div>
                          {b.body.trim() ? (
                            <div className="mt-0.5">
                              <PreviewRichHtml html={b.body} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : null}
                {merged.experienceIncluded.filter((x) => x.trim()).length ? (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">What&apos;s included</p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {merged.experienceIncluded.filter((x) => x.trim()).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {merged.waysHeading.trim() ? <PreviewH2 text={merged.waysHeading} /> : null}
                {merged.waysBullets.filter((x) => x.trim()).length ? (
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    {merged.waysBullets.filter((x) => x.trim()).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : null}
              </PreviewSection>

              <PreviewSection title="Areas & booking">
                {merged.areasCopy.trim() ? (
                  <div className="text-xs">
                    <PreviewRichHtml html={merged.areasCopy} />
                  </div>
                ) : null}
                {merged.areasList.filter((x) => x.trim()).length ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                    {merged.areasList.filter((x) => x.trim()).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : null}
                {merged.areasCta.trim() ? <p className="mt-2 text-xs font-medium">{merged.areasCta}</p> : null}
                {merged.contactPhone.trim() || merged.contactWhatsapp.trim() ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {merged.contactPhone.trim() ? <span>Phone: {merged.contactPhone}</span> : null}
                    {merged.contactPhone.trim() && merged.contactWhatsapp.trim() ? ' · ' : null}
                    {merged.contactWhatsapp.trim() ? <span>WhatsApp: {merged.contactWhatsapp}</span> : null}
                  </p>
                ) : null}
                {merged.bookingSteps.some((s) => s.title.trim()) ? (
                  <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs text-muted-foreground marker:font-medium">
                    {merged.bookingSteps
                      .filter((s) => s.title.trim())
                      .map((s, i) => (
                        <li key={i} className="pl-1">
                          <span className="font-medium text-foreground">{s.title}</span>
                          {s.description.trim() ? (
                            <div className="mt-0.5 font-normal">
                              <PreviewRichHtml html={s.description} />
                            </div>
                          ) : null}
                        </li>
                      ))}
                  </ol>
                ) : null}
              </PreviewSection>

              <PreviewSection title="Pricing & comparison">
                {merged.pricingIncluded.filter((x) => x.trim()).length ? (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Included</p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {merged.pricingIncluded.filter((x) => x.trim()).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {merged.pricingExcluded.filter((x) => x.trim()).length ? (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Excluded</p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {merged.pricingExcluded.filter((x) => x.trim()).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {merged.comparisonRows.some((r) => r.label.trim()) ? (
                  <div className="mb-2 overflow-x-auto">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Comparison</p>
                    <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="py-1 pr-2 font-medium"> </th>
                          <th className="py-1 pr-2 font-medium">ProFixer</th>
                          <th className="py-1 font-medium">Others</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merged.comparisonRows
                          .filter((r) => r.label.trim())
                          .map((r, i) => (
                            <tr key={i} className="border-b border-border/30 align-top">
                              <td className="py-1 pr-2 text-muted-foreground">{r.label}</td>
                              <td className="py-1 pr-2">{r.profixer || '—'}</td>
                              <td className="py-1">{r.others || '—'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {merged.spareParts.some((p) => p.name.trim()) ? (
                  <ul className="text-xs text-muted-foreground">
                    {merged.spareParts
                      .filter((p) => p.name.trim())
                      .map((p, i) => (
                        <li key={i}>
                          {p.name}
                          {p.priceRange.trim() ? ` — ${p.priceRange}` : null}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No spare-parts rows</p>
                )}
              </PreviewSection>

              <PreviewSection title="FAQs">
                {merged.faqs.some((f) => f.question.trim()) ? (
                  <dl className="space-y-2 text-xs">
                    {merged.faqs
                      .filter((f) => f.question.trim())
                      .map((f, i) => (
                        <div key={i}>
                          <dt className="font-medium text-foreground">{f.question}</dt>
                          <dd className="mt-0.5 text-muted-foreground">
                            {f.answer.trim() ? <PreviewRichHtml html={f.answer} /> : '—'}
                          </dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground">None</p>
                )}
              </PreviewSection>

              <PreviewSection title="Related links">
                {merged.relatedLinks.some((l) => l.url.trim()) ? (
                  <ul className="text-xs">
                    {merged.relatedLinks
                      .filter((l) => l.url.trim())
                      .map((l, i) => (
                        <li key={i}>
                          <span className="text-muted-foreground">{l.label || l.url}</span>
                          <span className="ml-1 font-mono text-[10px] break-all">{l.url}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">None</p>
                )}
              </PreviewSection>

              <PreviewSection title="Closing">
                {merged.closingParagraph.trim() ? (
                  <PreviewRichHtml html={merged.closingParagraph} />
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </PreviewSection>

              <PreviewSection title="Locality guide" kicker={merged.localityGuide.enabled ? 'On' : 'Off'}>
                {merged.localityGuide.enabled ? (
                  <div className="space-y-3 text-xs text-muted-foreground">
                    {merged.localityGuide.articleH2.trim() ? <PreviewH2 text={merged.localityGuide.articleH2} /> : null}
                    {merged.localityGuide.summaryLead.trim() ? (
                      <PreviewRichHtml html={merged.localityGuide.summaryLead} />
                    ) : null}
                    {merged.localityGuide.leadParagraphs.filter((p) => p.trim()).map((p, j) => (
                      <PreviewRichHtml key={`lead-${j}`} html={p} className="mt-1" />
                    ))}
                    {merged.localityGuide.sections.filter((s) => s.h2.trim()).map((s, i) => (
                      <div key={i} className="rounded-md border border-border/60 bg-muted/20 p-3">
                        <div className="font-medium text-foreground">{s.h2}</div>
                        {s.paragraphs.filter((p) => p.trim()).map((p, j) => (
                          <div key={j} className="mt-2">
                            <PreviewRichHtml html={p} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Disabled for this key</p>
                )}
              </PreviewSection>

              <PreviewSection title="Lead magnet" kicker="Closing CTA block">
                {merged.leadMagnet.headline.trim() || merged.leadMagnet.description.trim() ? (
                  <div className="text-xs">
                    <p className="font-medium">{merged.leadMagnet.headline}</p>
                    <div className="mt-1 text-muted-foreground">
                      <PreviewRichHtml html={merged.leadMagnet.description} />
                    </div>
                    {merged.leadMagnet.ctaLabel.trim() ? (
                      <p className="mt-2 inline-block rounded-md bg-primary px-2 py-1 text-primary-foreground">
                        {merged.leadMagnet.ctaLabel}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </PreviewSection>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function PreviewSection({
  title,
  kicker,
  children,
}: {
  title: string
  kicker?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {kicker ? (
          <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">{kicker}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function PreviewH1({ text }: { text: string }) {
  return <h4 className="text-lg font-bold tracking-tight text-foreground">{text}</h4>
}

function PreviewH2({ text }: { text: string }) {
  return <h4 className="mt-1 text-sm font-semibold text-foreground">{text}</h4>
}

function PreviewP({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <p className="text-xs">
      <span className="text-muted-foreground">{kicker}: </span>
      {children}
    </p>
  )
}
