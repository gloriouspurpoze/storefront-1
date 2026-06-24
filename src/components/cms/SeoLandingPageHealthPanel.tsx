import React, { useMemo } from 'react'
import { CheckCircle2, Circle, ChevronRight, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type {
  SeoLandingEditorTab,
  SeoLandingQualityReport,
} from '../../lib/seoLandingContentQuality'
import { SEO_LANDING_MIN_WORDS, SEO_LANDING_OPTIMAL_WORDS } from '../../lib/seoLandingPageKinds'
import type { LengthWarning } from '../../lib/seoLandingContentLengthRules'
import { SeoContentLengthHintList } from './SeoContentLengthHint'

const GROUP_ORDER = ['Setup', 'Content', 'Links', 'SEO'] as const

type Props = {
  report: SeoLandingQualityReport
  lengthWarnings?: LengthWarning[]
  onNavigateTab: (tab: SeoLandingEditorTab) => void
  className?: string
}

export function SeoLandingPageHealthPanel({ report, lengthWarnings = [], onNavigateTab, className }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof report.items>()
    for (const g of GROUP_ORDER) map.set(g, [])
    for (const item of report.items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return GROUP_ORDER.map((g) => ({ group: g, items: map.get(g) ?? [] })).filter((x) => x.items.length > 0)
  }, [report.items])

  const missingRequired = report.requiredTotal - report.requiredPassed
  const lengthIssues = lengthWarnings.filter((w) => w.severity !== 'ok')

  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">Page health</CardTitle>
            <CardDescription className="text-xs">
              Content quality checklist — fix required items before publishing.
            </CardDescription>
          </div>
          <Badge variant={report.statusVariant}>{report.statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{report.score}% complete</span>
            <span className="text-muted-foreground tabular-nums">
              {report.passed}/{report.total} checks
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                report.score >= 90
                  ? 'bg-emerald-500'
                  : report.score >= 65
                    ? 'bg-primary'
                    : 'bg-amber-500',
              )}
              style={{ width: `${report.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
            <strong className="font-medium text-foreground">{report.wordCount.toLocaleString()}</strong> words
            {' · '}
            min {SEO_LANDING_MIN_WORDS.toLocaleString()}, optimal {SEO_LANDING_OPTIMAL_WORDS.toLocaleString()}+
          </p>
        </div>

        {missingRequired > 0 ? (
          <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>{missingRequired}</strong> required{' '}
              {missingRequired === 1 ? 'item' : 'items'} still open — page stays draft / noindex until fixed.
            </span>
          </div>
        ) : (
          <div className="flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>All required checks pass. Polish recommended items for stronger rankings.</span>
          </div>
        )}

        {lengthIssues.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Length & readability
              </p>
              <span className="text-[10px] text-muted-foreground tabular-nums">{lengthIssues.length} issue(s)</span>
            </div>
            <SeoContentLengthHintList
              warnings={lengthIssues}
              issuesOnly
              onNavigate={onNavigateTab}
            />
          </div>
        ) : null}

        <div className="space-y-4">
          {grouped.map(({ group, items }) => {
            const done = items.filter((i) => i.ok).length
            return (
              <div key={group}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {done}/{items.length}
                  </span>
                </div>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(item.tab)}
                        className={cn(
                          'group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
                          'hover:bg-muted/60',
                          !item.ok && item.priority === 'required' && 'bg-amber-500/5',
                        )}
                      >
                        {item.ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={cn('font-medium', item.ok ? 'text-foreground' : 'text-foreground/90')}>
                            {item.label}
                            {item.priority === 'required' && !item.ok ? (
                              <span className="ml-1 font-normal text-amber-600 dark:text-amber-400">· required</span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground leading-snug">{item.detail}</span>
                        </span>
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition group-hover:opacity-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
