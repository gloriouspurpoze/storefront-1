import React from 'react'
import { Check } from 'lucide-react'
import type { OrderStatus } from '../../services/api/orders.service'
import { cn } from '../../lib/utils'

const DELIVERY_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
}

export interface DeliveryStepperProps {
  status: OrderStatus
  className?: string
}

export function DeliveryStepper({ status, className }: DeliveryStepperProps) {
  const isTerminalBad = status === 'cancelled' || status === 'refunded'
  const currentRank = STATUS_RANK[status] ?? 0

  if (isTerminalBad) {
    return (
      <p className={cn('text-sm capitalize text-muted-foreground', className)}>
        Order {status}
      </p>
    )
  }

  return (
    <ol className={cn('flex flex-wrap items-center gap-1 sm:gap-0', className)}>
      {DELIVERY_STEPS.map((step, index) => {
        const stepRank = STATUS_RANK[step.key]
        const done = currentRank > stepRank
        const active = status === step.key

        return (
          <li key={step.key} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium sm:px-3',
                done && 'bg-storm-deep/15 text-storm-deep',
                active && 'bg-primary text-primary-foreground',
                !done && !active && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <span
                  className={cn(
                    'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                    active && 'border-primary-foreground',
                  )}
                >
                  {index + 1}
                </span>
              )}
              <span>{step.label}</span>
            </div>
            {index < DELIVERY_STEPS.length - 1 && (
              <span
                className="mx-1 hidden h-px w-4 bg-border sm:inline-block md:w-8"
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
