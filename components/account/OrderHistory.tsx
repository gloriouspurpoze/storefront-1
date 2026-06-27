'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchCustomerOrderTracking,
  fetchCustomerOrders,
  type CustomerOrderSummary,
  type PublicOrderTracking,
} from '@/lib/storefront-api'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { OrderStatusBadge, OrderTrackingPanel } from './OrderTrackingPanel'
import { displayName } from '@/lib/storefront-auth'

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

export function OrderHistory({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, PublicOrderTracking>>({})
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated || !tokens?.accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCustomerOrders({ tenantId, accessToken: tokens.accessToken })
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

  const loadTracking = useCallback(
    async (orderNumber: string) => {
      if (!tokens?.accessToken) return

      setTrackingLoading(orderNumber)
      setTrackingError(null)
      try {
        const data = await fetchCustomerOrderTracking({
          tenantId,
          accessToken: tokens.accessToken,
          orderNumber,
        })
        if (!data) {
          setTrackingError('Could not load tracking for this order.')
          return
        }
        setTrackingByOrder((prev) => ({ ...prev, [orderNumber]: data }))
      } catch {
        setTrackingError('Could not load tracking for this order.')
      } finally {
        setTrackingLoading(null)
      }
    },
    [tenantId, tokens?.accessToken],
  )

  const onCardClick = (orderNumber: string) => {
    if (expandedOrder === orderNumber) {
      setExpandedOrder(null)
      setTrackingError(null)
      return
    }
    setExpandedOrder(orderNumber)
    setTrackingError(null)
    if (!trackingByOrder[orderNumber]) {
      void loadTracking(orderNumber)
    }
  }

  if (!isReady) {
    return <p className={t.statusLoading}>Loading…</p>
  }

  if (!isAuthenticated) {
    return (
      <div className={t.emptyState}>
        <p className={t.text}>Sign in to view your orders.</p>
        <Link href="/account/login" className={`${t.btnPrimary} ${t.btnBlock}`}>
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <AccountPageHeader
        title="Your orders"
        // subtitle={`Order history for ${user ? displayName(user) : 'your account'}. Tap an order for live tracking.`}
      />

      {loading ? (
        <p className={t.statusLoading}>Loading orders…</p>
      ) : error ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className={t.emptyState}>
          <p className={t.emptyTitle}>No orders yet</p>
          <p className={`${t.textMuted} mt-1`}>
            Orders placed while signed in will appear here.
          </p>
          <Link href="/" className={`${t.btnSecondary} ${t.btnBlock}`}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className={t.orderList}>
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.orderNumber
            const tracking = trackingByOrder[order.orderNumber]
            const isLoadingTrack = trackingLoading === order.orderNumber

            return (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => onCardClick(order.orderNumber)}
                  className={`${t.orderCard} ${isExpanded ? t.orderCardExpanded : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className={t.orderMeta}>{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-medium">{formatMoney(order.totalAmount)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>

                  <ul className={t.orderItems}>
                    {order.items.map((item, idx) => (
                      <li key={`${order.id}-${idx}`}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>

                  <p className={`${t.textMuted} mt-3 text-xs font-medium`}>
                    {isExpanded ? 'Hide tracking ↑' : 'View tracking details →'}
                  </p>
                </button>

                {isExpanded ? (
                  <div className={t.trackingPanel}>
                    {isLoadingTrack ? (
                      <p className={t.statusLoading}>Loading tracking…</p>
                    ) : trackingError && !tracking ? (
                      <p className={t.error}>{trackingError}</p>
                    ) : tracking ? (
                      <OrderTrackingPanel tracking={tracking} compact />
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
