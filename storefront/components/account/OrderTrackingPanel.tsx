'use client'

import { resolveTrackingUrl } from '@/lib/carrierTracking'
import type { PublicOrderTracking } from '@/lib/storefront-api'

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

export function OrderStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const tone =
    normalized === 'delivered'
      ? 'bg-emerald-100 text-emerald-800'
      : normalized === 'shipped'
        ? 'bg-blue-100 text-blue-800'
        : normalized === 'cancelled' || normalized === 'canceled'
          ? 'bg-red-100 text-red-800'
          : 'bg-neutral-100 text-neutral-700'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
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
  const trackUrl = resolveTrackingUrl({
    carrier: tracking.carrier as Parameters<typeof resolveTrackingUrl>[0]['carrier'],
    trackingNumber: tracking.trackingNumber,
    trackingUrl: tracking.trackingUrl,
  })

  return (
    <div className={compact ? 'space-y-4' : 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm'}>
      {!compact ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Order status</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-neutral-900">{statusLabel(tracking.status)}</h2>
            <OrderStatusBadge status={tracking.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-neutral-600">{tracking.orderNumber}</p>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OrderStatusBadge status={tracking.status} />
          {tracking.carrierLabel ? (
            <span className="text-xs text-neutral-500">{tracking.carrierLabel}</span>
          ) : null}
        </div>
      )}

      <dl className={`space-y-3 text-sm ${compact ? '' : 'mt-6'}`}>
        {tracking.carrierLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Carrier</dt>
            <dd className="font-medium text-neutral-900">{tracking.carrierLabel}</dd>
          </div>
        ) : null}
        {tracking.trackingNumber ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Tracking</dt>
            <dd className="font-mono font-medium text-neutral-900">{tracking.trackingNumber}</dd>
          </div>
        ) : null}
        {tracking.shippedAt ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Shipped</dt>
            <dd>{formatWhen(tracking.shippedAt)}</dd>
          </div>
        ) : null}
        {tracking.deliveredAt ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Delivered</dt>
            <dd>{formatWhen(tracking.deliveredAt)}</dd>
          </div>
        ) : null}
        {tracking.estimatedDeliveryAt ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Est. delivery</dt>
            <dd>{formatWhen(tracking.estimatedDeliveryAt)}</dd>
          </div>
        ) : null}
      </dl>

      {trackUrl ? (
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? 'inline-flex text-sm font-medium text-neutral-900 underline underline-offset-2'
              : 'mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white'
          }
          style={compact ? undefined : { backgroundColor: brandColor ?? '#171717' }}
        >
          Open carrier tracking
        </a>
      ) : null}

      {tracking.statusHistory && tracking.statusHistory.length > 0 ? (
        <ul className={`space-y-2 text-sm ${compact ? 'border-t border-neutral-100 pt-4' : 'mt-6 border-t border-neutral-100 pt-4'}`}>
          {[...tracking.statusHistory]
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex justify-between gap-2">
                <span className="text-neutral-800">{statusLabel(h.status)}</span>
                <span className="text-neutral-500">{formatWhen(h.at)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  )
}
