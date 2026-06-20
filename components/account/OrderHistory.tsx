'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCustomerOrders, type CustomerOrderSummary } from '@/lib/storefront-api'
import { useAccountAuth } from './AccountAuthProvider'
import { displayName } from '@/lib/storefront-auth'
import { resolveTrackingUrl } from '@/lib/carrierTracking'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function OrderHistory({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated || !tokens?.accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCustomerOrders({
      tenantId,
      accessToken: tokens.accessToken,
    })
      .then((data) => {
        if (!cancelled) setOrders(data.orders)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load orders')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId])

  if (!isReady) {
    return <p className="text-sm text-neutral-500">Loading…</p>
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-neutral-600">Sign in to view your orders.</p>
        <Link
          href="/account/login"
          className="mt-4 inline-flex rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Your orders</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Order history for {user ? displayName(user) : 'your account'} at this store.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading orders…</p>
      ) : error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="font-medium text-neutral-800">No orders yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Orders placed with the same Google account or email will appear here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const trackUrl = resolveTrackingUrl({
              carrier: order.carrier as Parameters<typeof resolveTrackingUrl>[0]['carrier'],
              trackingNumber: order.trackingNumber,
              trackingUrl: order.trackingUrl,
            })
            return (
              <li
                key={order.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">{order.orderNumber}</p>
                    <p className="mt-0.5 text-sm text-neutral-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-900">{formatMoney(order.totalAmount)}</p>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                      {statusLabel(order.status)}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
                  {order.items.map((item, idx) => (
                    <li key={`${order.id}-${idx}`}>
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>

                {trackUrl ? (
                  <a
                    href={trackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-neutral-900 underline underline-offset-2"
                  >
                    Track shipment
                  </a>
                ) : (
                  <Link
                    href={`/orders/track?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                    className="mt-4 inline-flex text-sm font-medium text-neutral-700 underline underline-offset-2"
                  >
                    Track order
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
