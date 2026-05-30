import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

/**
 * Tone → DESIGN.md token map. Legacy tone names (cyan/amber/sky) are kept as
 * aliases so existing callers don't break — they all collapse to DESIGN.md's
 * narrow palette: primary, storm, bloom-coral.
 *
 *   primary           → colors.primary
 *   info  / sky / cyan → colors.primary       (HP Electric Blue is the lone signal)
 *   warning / amber    → colors.bloom-coral   (DESIGN.md sale-tag coral)
 *   success            → colors.storm-deep    (DESIGN.md neutral positive)
 */
const shell = {
  primary:
    'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:-translate-y-1 hover:shadow-soft-lift',
  info: 'border-primary/20 bg-gradient-to-br from-primary-soft/60 to-primary-soft/20 hover:-translate-y-1 hover:shadow-soft-lift',
  sky: 'border-primary/20 bg-gradient-to-br from-primary-soft/60 to-primary-soft/20 hover:-translate-y-1 hover:shadow-soft-lift',
  cyan: 'border-storm-deep/20 bg-gradient-to-br from-storm-mist/40 to-storm-mist/10 hover:-translate-y-1 hover:shadow-soft-lift',
  warning:
    'border-bloom-coral/30 bg-gradient-to-br from-bloom-rose to-bloom-rose/30 hover:-translate-y-1 hover:shadow-soft-lift',
  amber:
    'border-bloom-coral/30 bg-gradient-to-br from-bloom-rose to-bloom-rose/30 hover:-translate-y-1 hover:shadow-soft-lift',
  success:
    'border-storm-deep/20 bg-gradient-to-br from-storm-mist/40 to-storm-mist/10 hover:-translate-y-1 hover:shadow-soft-lift',
} as const

const valueColor = {
  primary: 'text-primary',
  info: 'text-primary-deep',
  sky: 'text-primary-deep',
  cyan: 'text-storm-deep',
  warning: 'text-bloom-deep',
  amber: 'text-bloom-deep',
  success: 'text-storm-deep',
} as const

const iconBox = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-primary-soft text-primary-deep',
  sky: 'bg-primary-soft text-primary-deep',
  cyan: 'bg-storm-mist/30 text-storm-deep',
  warning: 'bg-bloom-rose text-bloom-deep',
  amber: 'bg-bloom-rose text-bloom-deep',
  success: 'bg-storm-mist/30 text-storm-deep',
} as const

export type StatHighlightTone = keyof typeof shell

export interface StatHighlightCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  tone?: StatHighlightTone
  className?: string
}

/**
 * Horizontal stat strip (label + value left, icon right) with gradient border.
 * Used on CMS dashboard and similar overview rows.
 */
export function StatHighlightCard({
  label,
  value,
  icon,
  tone = 'primary',
  className,
}: StatHighlightCardProps) {
  return (
    <Card className={cn('transition-transform', shell[tone], className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="mb-1 text-caption-md font-medium text-graphite">{label}</p>
          <p className={cn('text-3xl font-bold', valueColor[tone])}>{value}</p>
        </div>
        <div
          className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconBox[tone])}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
