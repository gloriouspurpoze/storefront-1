'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchCustomerEnquiries,
  fetchCustomerOrders,
  type CustomerEnquirySummary,
  type CustomerOrderSummary,
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
import { OrderStatusBadge } from './OrderTrackingPanel'
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

const PAGE_SIZE = 20

type OrderFilterKey = 'all' | 'active' | 'delivered' | 'cancelled'

const ORDER_FILTERS: Array<{ key: OrderFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

function matchesFilter(status: string, filter: OrderFilterKey): boolean {
  const s = status.toLowerCase()
  if (filter === 'all') return true
  if (filter === 'delivered') return s === 'delivered' || s === 'completed'
  if (filter === 'cancelled') return s === 'cancelled' || s === 'refunded'
  return !['delivered', 'completed', 'cancelled', 'refunded'].includes(s)
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
  const [filter, setFilter] = useState<OrderFilterKey>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

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
            fetchCustomerOrders({ tenantId, accessToken: token, limit: PAGE_SIZE }).then((data) => {
              if (!cancelled) {
                setOrders(data.orders)
                setPage(1)
                setTotalPages(data.pagination?.totalPages ?? 1)
              }
            }),
            fetchCustomerEnquiries({ tenantId, accessToken: token }).then((data) => {
              if (!cancelled) setEnquiries(data.enquiries)
            }),
          ])
        : fetchCustomerOrders({ tenantId, accessToken: token, limit: PAGE_SIZE }).then((data) => {
            if (!cancelled) {
              setOrders(data.orders)
              setPage(1)
              setTotalPages(data.pagination?.totalPages ?? 1)
            }
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

  const loadMore = useCallback(async () => {
    if (!tokens?.accessToken) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const data = await fetchCustomerOrders({
        tenantId,
        accessToken: tokens.accessToken,
        page: next,
        limit: PAGE_SIZE,
      })
      setOrders((prev) => {
        const seen = new Set(prev.map((o) => o.id))
        return [...prev, ...data.orders.filter((o) => !seen.has(o.id))]
      })
      setPage(next)
      setTotalPages(data.pagination?.totalPages ?? next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more orders')
    } finally {
      setLoadingMore(false)
    }
  }, [page, tenantId, tokens?.accessToken])

  const visibleOrders = useMemo(
    () => orders.filter((o) => matchesFilter(o.status, filter)),
    [orders, filter],
  )
  const hasMore = page < totalPages

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
                : `Order history for ${displayName(user)}. Open an order for tracking, receipt, or to cancel.`
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
              <>
              <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
                {ORDER_FILTERS.map((f) => {
                  const count = orders.filter((o) => matchesFilter(o.status, f.key)).length
                  const selected = filter === f.key
                  return (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        selected
                          ? 'border-[var(--site-brand,#171717)] bg-[var(--site-brand,#171717)] text-white'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      {f.label}
                      <span className="ml-1.5 opacity-70">{count}</span>
                    </button>
                  )
                })}
              </div>
              {visibleOrders.length === 0 ? (
                <div className={t.emptyState}>
                  <p className={t.emptyTitle}>No {filter} orders</p>
                </div>
              ) : null}
              <ul className={t.orderList}>
                {visibleOrders.map((order) => {
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                        className={`${t.orderCard} block no-underline`}
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
                          View details, tracking &amp; receipt →
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {hasMore ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className={t.btnSecondary}
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? 'Loading…' : 'Load more orders'}
                  </button>
                </div>
              ) : null}
              </>
            )}
          </>
        )}
      </div>
    </RequireStorefrontAuth>
  )
}
