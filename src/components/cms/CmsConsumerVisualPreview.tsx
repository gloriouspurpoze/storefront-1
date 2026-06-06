import React from 'react'
import { cn } from '../../lib/utils'
import type { CategoryMarketingConfig } from '../../types/categoryMarketing'
import { sanitizeCategoryMarketingRichHtml } from '../../lib/categoryMarketingRichHtml'

const prosePreview =
  'cms-consumer-preview prose prose-sm max-w-none dark:prose-invert [&_img]:my-3 [&_img]:max-h-56 [&_img]:w-full [&_img]:rounded-lg [&_img]:object-cover [&_a]:text-primary [&_a]:underline'

/** Sanitized CMS HTML for admin previews — mirrors consumer `SanitizedMarketingHtml`. */
export function ConsumerPreviewRichHtml({ html, className }: { html: string; className?: string }) {
  const raw = html.trim()
  if (!raw) return null
  if (!raw.includes('<')) {
    return (
      <div className={cn('whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground', className)}>{raw}</div>
    )
  }
  let safe = ''
  try {
    safe = sanitizeCategoryMarketingRichHtml(raw)
  } catch {
    return <p className="text-xs text-muted-foreground">Preview unavailable (sanitize error).</p>
  }
  if (!safe.trim()) return null
  return (
    <div
      className={cn(prosePreview, 'text-sm leading-relaxed text-muted-foreground', className)}
      // eslint-disable-next-line react/no-danger -- admin-only; DOMPurify sanitized
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}

export function CmsSectionPreviewCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-dashed border-primary/25 bg-gradient-to-b from-muted/30 to-transparent p-4', className)}>
      <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary/80">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
        Preview · {title}
      </p>
      {children}
    </div>
  )
}

export function CmsConsumerVisualPreview({
  config,
  viewport = 'desktop',
  className,
}: {
  config: CategoryMarketingConfig
  viewport?: 'desktop' | 'mobile'
  className?: string
}) {
  const isMobile = viewport === 'mobile'
  const cards = config.serviceCards.filter((c) => c.title.trim())
  const faqs = config.faqs.filter((f) => f.question.trim())

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm transition-all',
        isMobile ? 'max-w-[390px]' : 'max-w-3xl',
        className,
      )}
    >
      {/* Hero strip */}
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-background px-5 py-6 sm:px-7">
        {config.heroTrustBadge.trim() ? (
          <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            {config.heroTrustBadge}
          </span>
        ) : null}
        <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {config.mainHeading.trim() || '— Add main heading (Hero tab)'}
        </h1>
        {config.heroChip.trim() ? (
          <p className="mt-1 text-xs font-medium text-muted-foreground">{config.heroChip}</p>
        ) : null}
        {config.intro.trim() || config.image1?.trim() ? (
          <div
            className={cn(
              'mt-4',
              !isMobile && config.image1?.trim() && config.intro.trim()
                ? 'grid grid-cols-2 items-center gap-4'
                : '',
            )}
          >
            {config.intro.trim() ? (
              <div className="min-w-0">
                <ConsumerPreviewRichHtml html={config.intro} />
              </div>
            ) : null}
            {config.image1?.trim() ? (
              <div className={cn('space-y-2', config.intro.trim() && isMobile ? 'mt-3' : '')}>
                <img
                  src={config.image1}
                  alt={config.mainHeading.trim() || 'Hero image'}
                  className="max-h-48 w-full rounded-lg object-cover"
                  loading="lazy"
                />
                {config.image2?.trim() ? (
                  <img
                    src={config.image2}
                    alt={config.mainHeading.trim() || 'Secondary image'}
                    className="max-h-32 w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {config.topicChips.filter((x) => x.trim()).length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {config.topicChips
              .filter((x) => x.trim())
              .slice(0, 6)
              .map((chip, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-foreground"
                >
                  {chip}
                </span>
              ))}
          </div>
        ) : null}
      </div>

      {/* Service cards */}
      {cards.length > 0 ? (
        <div className="border-b border-border/40 px-5 py-5 sm:px-7">
          <h2 className="text-sm font-semibold text-foreground">Service cards</h2>
          <div className={cn('mt-3 grid gap-3', isMobile ? 'grid-cols-1' : 'sm:grid-cols-2')}>
            {cards.slice(0, 4).map((card, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                {card.price.trim() ? (
                  <p className="mt-0.5 text-xs font-medium text-primary">{card.price}</p>
                ) : null}
                {card.description.trim() ? (
                  <div className="mt-2">
                    <ConsumerPreviewRichHtml html={card.description} className="text-xs" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* FAQ + aside */}
      <div className={cn('grid gap-4 px-5 py-5 sm:px-7', isMobile ? 'grid-cols-1' : 'lg:grid-cols-12')}>
        {faqs.length > 0 ? (
          <div className={isMobile ? '' : 'lg:col-span-7'}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Support</p>
            <h2 className="mt-1 text-base font-bold text-foreground">Frequently asked questions</h2>
            <dl className="mt-4 space-y-3">
              {faqs.slice(0, 4).map((f, i) => (
                <div key={i} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                  <dt className="text-sm font-medium text-foreground">{f.question}</dt>
                  {f.answer.trim() ? (
                    <dd className="mt-1">
                      <ConsumerPreviewRichHtml html={f.answer} className="text-xs" />
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        <aside
          className={cn(
            'rounded-lg border border-border/60 bg-card p-4 shadow-sm',
            faqs.length > 0 && !isMobile ? 'lg:col-span-5' : '',
          )}
        >
          <h2 className="text-sm font-semibold text-foreground">
            {config.localityAsideTitle.trim() || config.mainHeading.trim() || 'Locality aside title'}
          </h2>
          {(config.localityAsideIntro.trim() || config.intro.trim()) ? (
            <div className="mt-2">
              <ConsumerPreviewRichHtml
                html={config.localityAsideIntro.trim() || config.intro}
                className="text-xs"
              />
            </div>
          ) : null}
          <div className="mt-4 border-t border-border/50 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {config.localityAsideBreadcrumbLabel.trim() || 'You are here'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Home / Services / … (from Technical SEO breadcrumb trail when set)
            </p>
          </div>
        </aside>
      </div>

      {/* Lead magnet */}
      {config.leadMagnet.headline.trim() ? (
        <div className="border-t border-border/40 bg-primary/5 px-5 py-5 sm:px-7">
          <p className="text-sm font-semibold text-foreground">{config.leadMagnet.headline}</p>
          {config.leadMagnet.description.trim() ? (
            <div className="mt-2">
              <ConsumerPreviewRichHtml html={config.leadMagnet.description} className="text-xs" />
            </div>
          ) : null}
          {config.leadMagnet.ctaLabel.trim() ? (
            <span className="mt-3 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              {config.leadMagnet.ctaLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
