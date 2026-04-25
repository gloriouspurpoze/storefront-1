import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

const iconBoxTone = {
  emerald: 'bg-emerald-500/15 text-emerald-600',
  primary: 'bg-primary/15 text-primary',
  amber: 'bg-amber-500/15 text-amber-600',
  destructive: 'bg-destructive/15 text-destructive',
  sky: 'bg-sky-500/15 text-sky-600',
} as const

export type KpiIconTone = keyof typeof iconBoxTone

export interface KpiStatCardProps {
  /** Icon to show in the colored box */
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  /** Small text under the label (e.g. extra counts) */
  hint?: React.ReactNode
  tone?: KpiIconTone
  className?: string
}

/**
 * Vertical metric card: icon badge on top, large value, label, optional hint.
 * Used on payments, similar dashboards.
 */
export function KpiStatCard({ icon, value, label, hint, tone = 'primary', className }: KpiStatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div
          className={cn(
            'mb-2 flex h-12 w-12 items-center justify-center rounded-lg',
            iconBoxTone[tone],
          )}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint != null && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  )
}
