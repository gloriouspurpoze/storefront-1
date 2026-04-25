import React from 'react'
import { cn } from '../../lib/utils'
import { OrderStatus } from '../../types'
import { Badge, type BadgeProps } from '../ui/badge'

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: OrderStatus
  size?: 'small' | 'medium'
}

function statusClass(status: OrderStatus): string {
  switch (status) {
    case 'accepted':
      return 'border-transparent bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-100'
    case 'pending':
      return 'border-transparent bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100'
    case 'completed':
      return 'border-transparent bg-sky-200 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100'
    case 'rejected':
    case 'cancelled':
      return 'border-transparent bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-100'
    default:
      return 'border-transparent bg-muted text-muted-foreground'
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small', className, ...props }) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'max-w-full font-semibold capitalize',
        size === 'small' ? 'px-1.5 py-0 text-xs' : 'px-2 py-0.5 text-sm',
        statusClass(status),
        className
      )}
      {...props}
    >
      {status}
    </Badge>
  )
}
