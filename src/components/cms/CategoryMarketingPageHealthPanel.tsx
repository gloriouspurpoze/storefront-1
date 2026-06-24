import React from 'react'
import { CheckCircle2, Circle, ChevronRight, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type {
  CategoryMarketingQualityReport,
  CategoryMarketingTabKey,
} from '../../lib/categoryMarketingContentQuality'
import type { LengthWarning } from '../../lib/seoLandingContentLengthRules'
import { SeoContentLengthHintList } from './SeoContentLengthHint'

type Props = {
  report: CategoryMarketingQualityReport
  lengthWarnings?: LengthWarning[]
  onNavigateTab: (tab: CategoryMarketingTabKey) => void
  className?: string
  /** Writer mode — checklist groups collapsed by default. */
  compact?: boolean
}

export function CategoryMarketingPageHealthPanel({ report, lengthWarnings = [], onNavigateTab, className, compact = false }: Props) {
  const missingRequired = report.requiredTotal - report.requiredPassed
  const lengthIssues = lengthWarnings.filter((w) => w.severity !== 'ok')
  const openItems = report.items.filter((i) => !i.ok)

  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold">Checklist</CardTitle>
            {!compact ? (
              <CardDescription className="text-xs">Completeness for this page key.</CardDescription>
            ) : null}
          </div>
          <Badge variant={report.statusVariant}>{report.score}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                report.score >= 88 ? 'bg-emerald-500' : report.score >= 65 ? 'bg-primary' : 'bg-amber-500',
              )}
              style={{ width: `${report.score}%` }}
            />
          </div>
          {!compact ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              ~{report.wordCountEstimate.toLocaleString()} words · {report.passed}/{report.total} checks
            </p>
          ) : null}
        </div>

        {missingRequired > 0 ? (
          <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>{missingRequired}</strong> required {missingRequired === 1 ? 'item' : 'items'} left
            </span>
          </div>
        ) : null}

        {lengthIssues.length > 0 ? (
          <div className="space-y-1.5 rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Length ({lengthIssues.length})
            </p>
            <SeoContentLengthHintList
              warnings={lengthIssues}
              issuesOnly
              onNavigate={(t) => onNavigateTab(t as CategoryMarketingTabKey)}
            />
          </div>
        ) : null}

        <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
          {(compact ? openItems : report.items).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className={cn(
                  'group flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-[11px] transition hover:bg-muted/60',
                  !item.ok && item.priority === 'required' && 'bg-amber-500/5',
                )}
              >
                {item.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                )}
                <span className="min-w-0 flex-1 font-medium leading-snug">{item.label}</span>
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
        {compact && openItems.length === 0 ? (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">All checks pass.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
