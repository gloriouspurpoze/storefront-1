import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'
import {
  buildCategoryMarketingCoverageSections,
  coverageCompletionRatio,
  listSavedKeysForIndustry,
  localitySlugFromCompositeKey,
  type CoverageSection,
} from '../../lib/categoryMarketingCoverageOverview'
import type { CategoryMarketingConfig } from '../../types/categoryMarketing'

type Props = {
  /** Catalog slug from CMS (e.g. ac, electric) */
  industrySlug: string
  industryLabel: string
  /** Normalized locality slug or '' for industry-wide */
  localitySlug: string
  localityDisplayLabel: string
  effectiveStorageKey: string
  config: CategoryMarketingConfig
  allData: Record<string, CategoryMarketingConfig | unknown>
  onOpenSavedKey: (storageKey: string) => void
  className?: string
}

function SectionBlock({ section }: { section: CoverageSection }) {
  const doneCount = section.items.filter((i) => i.done).length
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{section.title}</p>
          {section.description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{section.description}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {doneCount}/{section.items.length}
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {section.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-[11px] leading-snug">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-storm-deep" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
            <span className={cn(item.done ? 'text-muted-foreground' : 'text-foreground')}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function IndustryLandingWorkspaceOverview({
  industrySlug,
  industryLabel,
  localitySlug,
  localityDisplayLabel,
  effectiveStorageKey,
  config,
  allData,
  onOpenSavedKey,
  className,
}: Props) {
  const sections = buildCategoryMarketingCoverageSections(config)
  const { filled, total } = coverageCompletionRatio(sections)
  const savedKeys = listSavedKeysForIndustry(allData as Record<string, unknown>, industrySlug)
  const isLocality = Boolean(localitySlug.trim())

  return (
    <Card className={cn('border-primary/15 bg-gradient-to-b from-primary/[0.03] to-card shadow-sm', className)}>
      <CardContent className="space-y-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-sm text-foreground">
            <li className="font-medium">{industryLabel}</li>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <li className="font-medium">{localityDisplayLabel}</li>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <li className="text-muted-foreground">Edit sections below, then Save</li>
          </ol>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Each <strong className="font-medium text-foreground">industry + location</strong> pair has its own saved
            template. The consumer merges <span className="font-mono text-[11px]">{industrySlug}</span> (defaults for
            all areas) with{' '}
            <span className="font-mono text-[11px]">
              {industrySlug}__{'{area}'}
            </span>{' '}
            when a visitor opens that location&apos;s URL — so set the industry-wide base first, then override per
            location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2">
          <span className="text-[11px] font-medium text-muted-foreground">Saved for this industry</span>
          <div className="flex flex-wrap gap-1.5">
            {savedKeys.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">Nothing saved yet — fill tabs and Save.</span>
            ) : (
              savedKeys.map((key) => {
                const isCurrent = key === effectiveStorageKey
                const loc = localitySlugFromCompositeKey(industrySlug, key)
                const label =
                  loc === '' ? (
                    <span>All areas <span className="text-muted-foreground">(base)</span></span>
                  ) : (
                    <span className="font-mono text-[11px]">{loc}</span>
                  )
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isCurrent ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 rounded-full px-2.5 text-[11px] font-normal"
                    onClick={() => onOpenSavedKey(key)}
                    title={`Edit ${key}`}
                  >
                    {label}
                  </Button>
                )
              })
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Content coverage — this page</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {filled}/{total} checks passed · Storage key{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{effectiveStorageKey}</code>
            </p>
          </div>
          {isLocality ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hyperlocal tab + Local SEO matter most here; missing items may fall back to the industry-wide base on
              the live site.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              This is your <strong className="font-medium text-foreground">default</strong> for the vertical; add a
              location above to create area-specific copy.
            </p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <SectionBlock key={s.id} section={s} />
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Manage URL segments under{' '}
          <Link to="/cms/category-marketing?tab=service-areas" className="font-medium underline">
            Service areas
          </Link>
          . Tokens in copy: <span className="font-mono">[City]</span>, <span className="font-mono">[Location]</span>,{' '}
          <span className="font-mono">[ServiceName]</span>.
        </p>
      </CardContent>
    </Card>
  )
}
