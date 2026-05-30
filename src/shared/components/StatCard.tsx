import React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  subtitle?: string
}

/**
 * StatCard color → DESIGN.md token map.
 *   primary   → colors.primary
 *   secondary → colors.charcoal
 *   success   → colors.storm-deep   (DESIGN.md neutral positive)
 *   error     → destructive / bloom-deep
 *   info      → colors.primary      (HP Electric Blue is the lone signal)
 *   warning   → colors.bloom-coral
 */
const colorClass: Record<NonNullable<StatCardProps['color']>, string> = {
  primary: 'text-primary',
  secondary: 'text-charcoal',
  success: 'text-storm-deep',
  error: 'text-destructive',
  info: 'text-primary',
  warning: 'text-bloom-coral',
}

export function StatCard({ title, value, change, icon, color = 'primary', subtitle }: StatCardProps) {
  const isPositive = change !== undefined ? change > 0 : null

  return (
    <Card className="h-full">
      <CardContent className="p-xl">
        <div className="mb-xs flex items-center justify-between">
          <p className="text-caption-md font-medium text-graphite">{title}</p>
          <div className={cn('text-2xl', colorClass[color])} aria-hidden>
            {icon}
          </div>
        </div>
        <p className="mb-1 text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="mb-1 text-caption-md text-graphite">{subtitle}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-0.5 text-caption-md">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-storm-deep" aria-hidden />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" aria-hidden />
            )}
            <span
              className={cn(
                'font-semibold',
                isPositive ? 'text-storm-deep' : 'text-destructive',
              )}
            >
              {isPositive ? '+' : ''}
              {change}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
