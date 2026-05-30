import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

interface OrderStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
    isNeutral?: boolean
  }
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
}

/**
 * OrderStatsCard tone → DESIGN.md token map.
 *   primary   → colors.primary
 *   secondary → colors.charcoal (neutral text on canvas)
 *   success   → colors.storm-deep   (DESIGN.md neutral positive)
 *   warning   → colors.bloom-coral
 *   error     → colors.bloom-deep / destructive
 *   info      → colors.primary      (HP Electric Blue is the lone signal)
 */
const colorClassMap: Record<NonNullable<OrderStatsCardProps['color']>, string> = {
  primary: 'text-primary',
  secondary: 'text-charcoal',
  success: 'text-storm-deep',
  warning: 'text-bloom-coral',
  error: 'text-destructive',
  info: 'text-primary',
}

export const OrderStatsCard: React.FC<OrderStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
}) => {
  const colorClass = colorClassMap[color]

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.isNeutral) {
      return <Minus className="h-4 w-4 text-bloom-coral" aria-hidden />
    }
    return trend.isPositive ? (
      <TrendingUp className="h-4 w-4 text-storm-deep" aria-hidden />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" aria-hidden />
    )
  }

  const getTrendTextClass = () => {
    if (!trend) return 'text-graphite'
    if (trend.isNeutral) return 'text-bloom-coral'
    return trend.isPositive ? 'text-storm-deep' : 'text-destructive'
  }

  return (
    <Card className="h-full">
      <CardContent className="p-xl">
        <div className="mb-xs flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-caption-md font-medium text-graphite">{title}</p>
            <p className="text-2xl font-bold sm:text-3xl">{value}</p>
            {subtitle && <p className="mt-0.5 text-caption-sm text-graphite">{subtitle}</p>}
          </div>
          {icon && <div className={cn('opacity-80', colorClass)}>{icon}</div>}
        </div>

        {trend && (
          <div className="flex items-center gap-0.5">
            {getTrendIcon()}
            <span className={cn('text-caption-md font-semibold', getTrendTextClass())}>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-caption-sm text-graphite">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
