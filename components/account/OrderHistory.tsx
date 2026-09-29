'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchCustomerEnquiries,
  fetchCustomerOrderTracking,
  fetchCustomerOrders,
  type CustomerEnquirySummary,
  type CustomerOrderSummary,
  type PublicOrderTracking,
} from '@/lib/storefront-api'
import {
  accountSkinPrefix,
  isTradeProAccountChrome,
  showsAccountOrdersAndEnquiries,
} from '@/lib/account-themes'
import { displayName } from '@/lib/storefront-auth'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountLayoutTheme, useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { OrderStatusBadge, OrderTrackingPanel } from './OrderTrackingPanel'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

function formatMoney(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

function enquiryStageLabel(stage: string, hybrid = false): string {
  const s = stage.toLowerCase()
  if (s === 'inquiry' || s === 'lead') return hybrid ? 'Enquiry sent' : 'Submitted'
  if (s === 'quoted') return 'Quote sent'
  if (s === 'scheduled') return 'Visit scheduled'
  if (s === 'in_progress') return 'In progress'
  if (s === 'won' || s === 'completed' || s === 'paid') return 'Completed'
  if (s === 'lost') return 'Closed'
  return stage.replace(/_/g, ' ')
}

export function OrderHistory({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const layoutTheme = useAccountLayoutTheme()
  const isTradePro = isTradeProAccountChrome(layoutTheme)
  const hybridOrdersAndEnquiries = showsAccountOrdersAndEnquiries(layoutTheme)
  const skin = accountSkinPrefix(themeKey)
  const t = accountThemeClasses(themeKey)
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [enquiries, setEnquiries] = useState<CustomerEnquirySummary[]>([])
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
    const token = tokens.accessToken

    const load = isTradePro
      ? fetchCustomerEnquiries({ tenantId, accessToken: token }).then((data) => {
          if (!cancelled) setEnquiries(data.enquiries)
        })
      : hybridOrdersAndEnquiries
        ? Promise.all([
            fetchCustomerOrders({ tenantId, accessToken: token }).then((data) => {
              if (!cancelled) setOrders(data.orders)
            }),
            fetchCustomerEnquiries({ tenantId, accessToken: token }).then((data) => {
              if (!cancelled) setEnquiries(data.enquiries)
            }),
          ])
        : fetchCustomerOrders({ tenantId, accessToken: token }).then((data) => {
            if (!cancelled) setOrders(data.orders)
          })

    load
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : isTradePro
                ? 'Could not load enquiries'
                : 'Could not load orders',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId, isTradePro, hybridOrdersAndEnquiries])

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

  if (isTradePro) {
    return (
      <RequireStorefrontAuth returnPath="/account/orders">
        <div>
          <AccountPageHeader
            title="Your enquiries"
            subtitle={
              user
                ? `Booking requests for ${displayName(user)}. Status updates as our team follows up.`
                : undefined
            }
          />

          {loading ? (
            <p className={t.statusLoading}>Loading enquiries…</p>
          ) : error ? (
            <p role="alert" className={t.error}>
              {error}
            </p>
          ) : enquiries.length === 0 ? (
            <div className={t.emptyState}>
              <p className={t.emptyTitle}>No enquiries yet</p>
              <p className={`${t.textMuted} mt-1`}>
                Enquiries you send while signed in appear here with their status.
              </p>
              <Link href="/services" className={`${t.btnSecondary} ${t.btnBlock}`}>
                Browse services
              </Link>
            </div>
          ) : (
            <ul className={t.orderList}>
              {enquiries.map((enquiry) => (
                <li key={enquiry.id}>
                  <div className={t.orderCard}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{enquiry.name}</p>
                        <p className={t.orderMeta}>{formatDate(enquiry.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {enquiry.amount > 0 ? (
                          <p className="font-medium">
                            {formatMoney(enquiry.amount, enquiry.currency || 'INR')}
                          </p>
                        ) : null}
                        <OrderStatusBadge status={enquiryStageLabel(enquiry.stage)} />
                      </div>
                    </div>
                    {enquiry.services.length > 0 ? (
                      <ul className={t.orderItems}>
                        {enquiry.services.map((item, idx) => (
                          <li key={`${enquiry.id}-${idx}`}>
                            {item.quantity}× {item.name}
                          </li>
                        ))}
                      </ul>
                    ) : enquiry.serviceCategory ? (
                      <p className={`${t.textMuted} mt-2 text-sm`}>{enquiry.serviceCategory}</p>
                    ) : null}
                    {enquiry.preferredDate ? (
                      <p className={`${t.textMuted} mt-2 text-xs`}>
                        Preferred date: {enquiry.preferredDate}
                      </p>
                    ) : null}
                    {enquiry.address ? (
                      <p className={`${t.textMuted} mt-1 text-xs`}>{enquiry.address}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </RequireStorefrontAuth>
    )
  }

  return (
    <RequireStorefrontAuth returnPath="/account/orders">
      <div>
        <AccountPageHeader
          title={hybridOrdersAndEnquiries ? 'Orders & enquiries' : 'Your orders'}
          subtitle={
            user
              ? hybridOrdersAndEnquiries
                ? `Orders and Mumbai shipping enquiries for ${displayName(user)}.`
                : `Order history for ${displayName(user)}. Tap an order for live tracking.`
              : undefined
          }
        />

        {loading ? (
          <p className={t.statusLoading}>Loading…</p>
        ) : error ? (
          <p role="alert" className={t.error}>
            {error}
          </p>
        ) : (
          <>
            {hybridOrdersAndEnquiries ? (
              <section className="mb-8">
                <h2 className={skin ? `${skin}-acct-section-title` : 'mb-3 text-lg font-semibold'}>
                  Shipping enquiries
                </h2>
                {enquiries.length === 0 ? (
                  <div className={t.emptyState}>
                    <p className={t.emptyTitle}>No enquiries yet</p>
                    <p className={`${t.textMuted} mt-1`}>
                      When you request delivery all over Mumbai, it shows here as Enquiry sent.
                    </p>
                  </div>
                ) : (
                  <ul className={t.orderList}>
                    {enquiries.map((enquiry) => (
                      <li key={enquiry.id}>
                        <div className={t.orderCard}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{enquiry.name}</p>
                              <p className={t.orderMeta}>{formatDate(enquiry.createdAt)}</p>
                            </div>
                            <OrderStatusBadge status={enquiryStageLabel(enquiry.stage, true)} />
                          </div>
                          {enquiry.services.length > 0 ? (
                            <ul className={t.orderItems}>
                              {enquiry.services.map((item, idx) => (
                                <li key={`${enquiry.id}-${idx}`}>
                                  {item.quantity}× {item.name}
                                </li>
                              ))}
                            </ul>
                          ) : enquiry.serviceCategory ? (
                            <p className={`${t.textMuted} mt-2 text-sm`}>{enquiry.serviceCategory}</p>
                          ) : null}
                          {enquiry.preferredDate ? (
                            <p className={`${t.textMuted} mt-2 text-xs`}>
                              Preferred date: {enquiry.preferredDate}
                            </p>
                          ) : null}
                          {enquiry.address ? (
                            <p className={`${t.textMuted} mt-1 text-xs`}>{enquiry.address}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {hybridOrdersAndEnquiries ? (
              <h2 className={skin ? `${skin}-acct-section-title` : 'mb-3 text-lg font-semibold'}>
                Orders
              </h2>
            ) : null}

            {orders.length === 0 ? (
              <div className={t.emptyState}>
                <p className={t.emptyTitle}>No orders yet</p>
                <p className={`${t.textMuted} mt-1`}>
                  {hybridOrdersAndEnquiries
                    ? 'Pickup and Mira Road delivery orders show here.'
                    : 'Orders you place while signed in appear here automatically.'}
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
                        <div
                          className={
                            skin
                              ? `${skin}-acct-order-row`
                              : 'flex flex-wrap items-start justify-between gap-3'
                          }
                        >
                          <div>
                            <p className={skin ? `${skin}-acct-order-num` : 'font-medium'}>
                              {order.orderNumber}
                            </p>
                            <p className={t.orderMeta}>{formatDate(order.createdAt)}</p>
                          </div>
                          <div
                            className={
                              skin ? `${skin}-acct-order-row-end` : 'flex flex-col items-end gap-2'
                            }
                          >
                            <p className={skin ? `${skin}-acct-order-amount` : 'font-medium'}>
                              {formatMoney(order.totalAmount)}
                            </p>
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

                        <p
                          className={
                            skin
                              ? `${skin}-acct-order-hint`
                              : `${t.textMuted} mt-3 text-xs font-medium`
                          }
                        >
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
          </>
        )}
      </div>
    </RequireStorefrontAuth>
  )
}
