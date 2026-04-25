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

const colorClass: Record<NonNullable<StatCardProps['color']>, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  success: 'text-green-600 dark:text-green-500',
  error: 'text-destructive',
  info: 'text-sky-600 dark:text-sky-400',
  warning: 'text-amber-600 dark:text-amber-500',
}

export function StatCard({ title, value, change, icon, color = 'primary', subtitle }: StatCardProps) {
  const isPositive = change !== undefined ? change > 0 : null

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('text-2xl', colorClass[color])} aria-hidden>
            {icon}
          </div>
        </div>
        <p className="mb-1 text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="mb-1 text-sm text-muted-foreground">{subtitle}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-0.5 text-sm">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" aria-hidden />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" aria-hidden />
            )}
            <span
              className={cn(
                'font-semibold',
                isPositive ? 'text-green-600 dark:text-green-500' : 'text-destructive'
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
