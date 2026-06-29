'use client'

import { useMemo } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  getTodayOrderingLabel,
  isStoreOpenNow,
} from '@/lib/orderingHours'
import './store-status.css'

export function useStoreStatus(config?: StorefrontConfig | null) {
  return useMemo(() => {
    const hours = getOrderingHoursFromConfig(config)
    const availability = getOrderingAvailabilityFromConfig(config)
    const isOpen = isStoreOpenNow(hours)
    const hoursLabel = getTodayOrderingLabel(hours)
    const statusText = availability.slotsNote
      ? availability.slotsNote
      : isOpen
        ? `Open · ${hoursLabel}`
        : `Closed · ${hoursLabel}`
    return { isOpen, statusText, hours, availability }
  }, [config])
}

export function StoreStatusBadge({
  config,
  className,
  compact,
}: {
  config?: StorefrontConfig | null
  className?: string
  compact?: boolean
}) {
  const { isOpen, statusText } = useStoreStatus(config)

  return (
    <div
      className={`sf-store-status${compact ? ' sf-store-status--compact' : ''}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`sf-store-status__dot${isOpen ? ' sf-store-status__dot--open' : ''}`}
        aria-hidden
      />
      <span className="sf-store-status__text">{statusText}</span>
    </div>
  )
}

export function StoreStatusCard({ config, className }: { config?: StorefrontConfig | null; className?: string }) {
  const { isOpen, statusText } = useStoreStatus(config)

  return (
    <div className={`sf-store-status-card${className ? ` ${className}` : ''}`} role="status">
      <div className={`sf-store-status-card__badge${isOpen ? ' sf-store-status-card__badge--open' : ''}`}>
        {isOpen ? 'Open now' : 'Closed'}
      </div>
      <p className="sf-store-status-card__copy">{statusText}</p>
    </div>
  )
}
