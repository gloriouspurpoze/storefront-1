'use client'

import { resolveTrackingUrl } from '@/lib/carrierTracking'
import type { PublicOrderTracking } from '@/lib/storefront-api'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'

function formatWhen(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusBadgeVariant(status: string, t: ReturnType<typeof accountThemeClasses>): string {
  const normalized = status.toLowerCase()
  if (normalized === 'delivered') return t.statusBadgeDelivered
  if (normalized === 'shipped') return t.statusBadgeShipped
  if (normalized === 'cancelled' || normalized === 'canceled') return t.statusBadgeCancelled
  return t.statusBadgeDefault
}

export function OrderStatusBadge({ status }: { status: string }) {
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)

  return (
    <span className={`${t.statusBadge} ${statusBadgeVariant(status, t)}`.trim()}>
      {statusLabel(status)}
    </span>
  )
}

export function OrderTrackingPanel({
  tracking,
  brandColor,
  compact = false,
}: {
  tracking: PublicOrderTracking
  brandColor?: string
  compact?: boolean
}) {
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const trackUrl = resolveTrackingUrl({
    carrier: tracking.carrier as Parameters<typeof resolveTrackingUrl>[0]['carrier'],
    trackingNumber: tracking.trackingNumber,
    trackingUrl: tracking.trackingUrl,
  })

  return (
    <div className={compact ? t.trackingCompactInner : t.trackingResult}>
      {!compact ? (
        <>
          <p className={t.trackingEyebrow}>Order status</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className={t.trackingStatusTitle}>{statusLabel(tracking.status)}</h2>
            <OrderStatusBadge status={tracking.status} />
          </div>
          <p className={t.trackingOrderNum}>{tracking.orderNumber}</p>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OrderStatusBadge status={tracking.status} />
          {tracking.carrierLabel ? (
            <span className={t.textMuted}>{tracking.carrierLabel}</span>
          ) : null}
        </div>
      )}

      <dl className={`${t.trackingDl} ${compact ? '' : 'mt-6'}`}>
        {tracking.carrierLabel ? (
          <div className={t.trackingRow}>
            <dt className={t.trackingDt}>Carrier</dt>
            <dd className={t.trackingDd}>{tracking.carrierLabel}</dd>
          </div>
        ) : null}
        {tracking.trackingNumber ? (
          <div className={t.trackingRow}>
            <dt className={t.trackingDt}>Tracking</dt>
            <dd className={`${t.trackingDd} font-mono`}>{tracking.trackingNumber}</dd>
          </div>
        ) : null}
        {tracking.shippedAt ? (
          <div className={t.trackingRow}>
            <dt className={t.trackingDt}>Shipped</dt>
            <dd>{formatWhen(tracking.shippedAt)}</dd>
          </div>
        ) : null}
        {tracking.deliveredAt ? (
          <div className={t.trackingRow}>
            <dt className={t.trackingDt}>Delivered</dt>
            <dd>{formatWhen(tracking.deliveredAt)}</dd>
          </div>
        ) : null}
        {tracking.estimatedDeliveryAt ? (
          <div className={t.trackingRow}>
            <dt className={t.trackingDt}>Est. delivery</dt>
            <dd>{formatWhen(tracking.estimatedDeliveryAt)}</dd>
          </div>
        ) : null}
      </dl>

      {trackUrl ? (
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={compact ? t.trackingCarrierLink : t.trackingCarrierBtn}
          style={
            compact || themeKey ? undefined : { backgroundColor: brandColor ?? '#171717' }
          }
        >
          Open carrier tracking
        </a>
      ) : null}

      {tracking.statusHistory && tracking.statusHistory.length > 0 ? (
        <ul className={t.trackingHistory}>
          {[...tracking.statusHistory]
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .map((h, i) => (
              <li key={`${h.at}-${i}`} className={t.trackingHistoryItem}>
                <span className={t.trackingHistoryStatus}>{statusLabel(h.status)}</span>
                <span className={t.trackingHistoryDate}>{formatWhen(h.at)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  )
}
