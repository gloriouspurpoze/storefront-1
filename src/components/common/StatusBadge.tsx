import React from 'react'
import { cn } from '../../lib/utils'
import { OrderStatus } from '../../types'
import { Badge, type BadgeProps } from '../ui/badge'

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: OrderStatus
  size?: 'small' | 'medium'
}

/**
 * StatusBadge — order/booking lifecycle pills.
 * Token map (DESIGN.md):
 *   accepted   → storm-mist surface + storm-deep ink   (neutral positive accent)
 *   pending    → bloom-rose surface + bloom-deep ink   (soft alert tone)
 *   completed  → primary-soft surface + primary-deep ink (done = closed-loop blue)
 *   rejected   → bloom-deep surface + on-ink           (destructive brick)
 *   cancelled  → bloom-deep surface + on-ink
 *   default    → cloud surface + graphite ink           (neutral)
 */
function statusClass(status: OrderStatus): string {
  switch (status) {
    case 'accepted':
      return 'border-transparent bg-storm-mist/40 text-storm-deep'
    case 'pending':
      return 'border-transparent bg-bloom-rose text-bloom-deep'
    case 'completed':
      return 'border-transparent bg-primary-soft text-primary-deep'
    case 'rejected':
    case 'cancelled':
      return 'border-transparent bg-bloom-deep text-on-ink'
    default:
      return 'border-transparent bg-cloud text-graphite'
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
        className,
      )}
      {...props}
    >
      {status}
    </Badge>
  )
}
