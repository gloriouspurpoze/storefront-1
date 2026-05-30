import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

/**
 * Tone → DESIGN.md token map. The semantic names (success/warning/info) are
 * preferred. The legacy color-family names (emerald/amber/sky) are kept as
 * aliases so existing callers don't break — they map to the same DESIGN.md
 * tokens as their semantic counterparts.
 *
 *   primary               → colors.primary
 *   success  / emerald    → colors.storm-deep   (DESIGN.md neutral status accent)
 *   warning  / amber      → colors.bloom-coral  (DESIGN.md sale-tag coral)
 *   info     / sky        → colors.primary      (blue is the lone signal CTA)
 *   destructive           → colors.bloom-deep
 */
const iconBoxTone = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-storm-mist/30 text-storm-deep',
  emerald: 'bg-storm-mist/30 text-storm-deep',
  warning: 'bg-bloom-rose text-bloom-deep',
  amber: 'bg-bloom-rose text-bloom-deep',
  info: 'bg-primary-soft text-primary-deep',
  sky: 'bg-primary-soft text-primary-deep',
  destructive: 'bg-destructive/15 text-destructive',
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
      <CardContent className="p-md">
        <div
          className={cn(
            'mb-xs flex h-12 w-12 items-center justify-center rounded-lg',
            iconBoxTone[tone],
          )}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-caption-md text-graphite">{label}</p>
        {hint != null && <div className="mt-1 text-caption-sm text-graphite">{hint}</div>}
      </CardContent>
    </Card>
  )
}
