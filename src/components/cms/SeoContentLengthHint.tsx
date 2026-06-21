import React from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { LengthWarning } from '../../lib/seoLandingContentLengthRules'

function severityIcon(severity: LengthWarning['severity']) {
  switch (severity) {
    case 'ok':
      return CheckCircle2
    case 'short':
    case 'long':
      return AlertTriangle
    case 'empty':
      return Info
  }
}

function severityClass(severity: LengthWarning['severity']): string {
  switch (severity) {
    case 'ok':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'short':
    case 'long':
      return 'text-amber-600 dark:text-amber-400'
    case 'empty':
      return 'text-muted-foreground'
  }
}

type HintProps = {
  warning: LengthWarning | null | undefined
  className?: string
  compact?: boolean
  showOk?: boolean
}

/** Inline length hint for a single field or block. */
export function SeoContentLengthHint({ warning, className, compact, showOk }: HintProps) {
  if (!warning) return null
  if (warning.severity === 'ok' && !showOk) return null

  const Icon = severityIcon(warning.severity)

  return (
    <p
      className={cn(
        'flex items-start gap-1.5 text-xs leading-snug',
        severityClass(warning.severity),
        className,
      )}
      role="status"
    >
      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', compact && 'h-3 w-3')} aria-hidden />
      <span>
        {!compact && <span className="font-medium">{warning.label}: </span>}
        {warning.message}
      </span>
    </p>
  )
}

type ListProps = {
  warnings: LengthWarning[]
  className?: string
  /** Only show short / long / empty — hide ok rows */
  issuesOnly?: boolean
  onNavigate?: (tab: NonNullable<LengthWarning['tab']>) => void
}

/** Stack of length warnings (e.g. under a section or in health panel). */
export function SeoContentLengthHintList({ warnings, className, issuesOnly = true, onNavigate }: ListProps) {
  const rows = issuesOnly ? warnings.filter((w) => w.severity !== 'ok') : warnings
  if (rows.length === 0) return null

  return (
    <ul className={cn('space-y-1.5', className)}>
      {rows.map((w) => (
        <li key={w.id}>
          {onNavigate && w.tab ? (
            <button
              type="button"
              onClick={() => onNavigate(w.tab!)}
              className="w-full text-left rounded-md px-1 py-0.5 hover:bg-muted/50 transition"
            >
              <SeoContentLengthHint warning={w} />
            </button>
          ) : (
            <SeoContentLengthHint warning={w} />
          )}
        </li>
      ))}
    </ul>
  )
}

/** One-line badge summary for section headers. */
export function SeoContentLengthBadge({ warnings }: { warnings: LengthWarning[] }) {
  const issues = warnings.filter((w) => w.severity !== 'ok')
  if (issues.length === 0) return null

  const short = issues.filter((w) => w.severity === 'short' || w.severity === 'empty').length
  const long = issues.filter((w) => w.severity === 'long').length

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      {short > 0 && long > 0
        ? `${short} short · ${long} long`
        : short > 0
          ? `${short} too short`
          : `${long} too long`}
    </span>
  )
}
