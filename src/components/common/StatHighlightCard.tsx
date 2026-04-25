import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

const shell = {
  primary:
    'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:-translate-y-1 hover:shadow-md',
  cyan: 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 hover:-translate-y-1 hover:shadow-md',
  amber:
    'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:-translate-y-1 hover:shadow-md',
  sky: 'border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5 hover:-translate-y-1 hover:shadow-md',
} as const

const valueColor = {
  primary: 'text-primary',
  cyan: 'text-cyan-600',
  amber: 'text-amber-600',
  sky: 'text-sky-600',
} as const

const iconBox = {
  primary: 'bg-primary/10 text-primary',
  cyan: 'bg-cyan-500/10 text-cyan-600',
  amber: 'bg-amber-500/10 text-amber-600',
  sky: 'bg-sky-500/10 text-sky-600',
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
          <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
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
