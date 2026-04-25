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

export const OrderStatsCard: React.FC<OrderStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
}) => {
  const colorClass =
    color === 'primary'
      ? 'text-primary'
      : color === 'secondary'
        ? 'text-secondary-foreground'
        : color === 'success'
          ? 'text-emerald-600'
          : color === 'error'
            ? 'text-destructive'
            : color === 'warning'
              ? 'text-amber-600'
              : 'text-sky-600'

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.isNeutral) {
      return <Minus className="h-4 w-4 text-amber-600" aria-hidden />
    }
    return trend.isPositive ? (
      <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" aria-hidden />
    )
  }

  const getTrendTextClass = () => {
    if (!trend) return 'text-muted-foreground'
    if (trend.isNeutral) return 'text-amber-600'
    return trend.isPositive ? 'text-emerald-600' : 'text-destructive'
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold sm:text-3xl">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {icon && <div className={cn('opacity-80', colorClass)}>{icon}</div>}
        </div>

        {trend && (
          <div className="flex items-center gap-0.5">
            {getTrendIcon()}
            <span className={cn('text-sm font-semibold', getTrendTextClass())}>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
