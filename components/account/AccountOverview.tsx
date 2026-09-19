'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { accountSkinPrefix, isTradeProAccountChrome } from '@/lib/account-themes'
import {
  fetchCustomerEnquiries,
  fetchCustomerOrders,
  fetchCustomerProfile,
  type CustomerEnquirySummary,
  type CustomerOrderSummary,
  type CustomerProfile,
} from '@/lib/storefront-api'
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

function isActiveOrder(status: string): boolean {
  const s = status.toLowerCase()
  return !['delivered', 'cancelled', 'refunded', 'completed'].includes(s)
}

function isOpenEnquiry(stage: string): boolean {
  const s = stage.toLowerCase()
  return !['won', 'completed', 'paid', 'lost'].includes(s)
}

function enquiryStageLabel(stage: string): string {
  const s = stage.toLowerCase()
  if (s === 'inquiry' || s === 'lead') return 'Submitted'
  if (s === 'quoted') return 'Quote sent'
  if (s === 'scheduled') return 'Visit scheduled'
  if (s === 'in_progress') return 'In progress'
  if (s === 'won' || s === 'completed' || s === 'paid') return 'Completed'
  if (s === 'lost') return 'Closed'
  return stage.replace(/_/g, ' ')
}

export function AccountOverview({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const layoutTheme = useAccountLayoutTheme()
  const isTradePro = isTradeProAccountChrome(layoutTheme)
  const skin = accountSkinPrefix(themeKey)
  const t = accountThemeClasses(themeKey)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [enquiries, setEnquiries] = useState<CustomerEnquirySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !isAuthenticated || !tokens?.accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const token = tokens.accessToken
    const profileP = fetchCustomerProfile({ tenantId, accessToken: token })
    const listP = isTradePro
      ? fetchCustomerEnquiries({ tenantId, accessToken: token, limit: 5 }).then((d) => {
          if (!cancelled) setEnquiries(d.enquiries)
        })
      : fetchCustomerOrders({ tenantId, accessToken: token, limit: 5 }).then((d) => {
          if (!cancelled) setOrders(d.orders)
        })

    Promise.all([profileP, listP])
      .then(([prof]) => {
        if (cancelled) return
        setProfile(prof)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load account')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId, isTradePro])

  const orderStats = useMemo(() => {
    const active = orders.filter((o) => isActiveOrder(o.status)).length
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    return { active, totalSpent, recentCount: orders.length }
  }, [orders])

  const enquiryStats = useMemo(() => {
    const open = enquiries.filter((e) => isOpenEnquiry(e.stage)).length
    return { open, recentCount: enquiries.length }
  }, [enquiries])

  const shopLabel = isTradePro
    ? 'Browse services'
    : skin === 'mf' || skin === 'bb'
      ? 'Order from menu'
      : 'Shop now'
  const shopHref = isTradePro ? '/services' : '/'
  const subtitle = isTradePro
    ? 'Check enquiry status and manage your profile.'
    : skin === 'mf'
      ? 'Your orders and account at a glance.'
      : 'Manage orders, track deliveries, and update your profile.'

  return (
    <RequireStorefrontAuth returnPath="/account">
      <AccountPageHeader
        title={`Welcome back${user ? `, ${displayName(user).split(' ')[0]}` : ''}`}
        subtitle={subtitle}
      />

      {loading ? (
        <p className={t.statusLoading}>Loading your dashboard…</p>
      ) : error ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : (
        <>
          {isTradePro ? (
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Open enquiries
                </p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">{enquiryStats.open}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Recent enquiries
                </p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">
                  {enquiryStats.recentCount}
                </p>
              </div>
            </div>
          ) : skin ? (
            <div className={`${skin}-acct-stats`}>
              <div className={`${skin}-acct-stat`}>
                <span className={`${skin}-acct-stat-label`}>Active orders</span>
                <span className={`${skin}-acct-stat-value`}>{orderStats.active}</span>
              </div>
              <div className={`${skin}-acct-stat`}>
                <span className={`${skin}-acct-stat-label`}>Recent orders</span>
                <span className={`${skin}-acct-stat-value`}>{orderStats.recentCount}</span>
              </div>
              <div className={`${skin}-acct-stat`}>
                <span className={`${skin}-acct-stat-label`}>Recent spend</span>
                <span className={`${skin}-acct-stat-value ${skin}-acct-stat-value--money`}>
                  {formatMoney(orderStats.totalSpent)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Active orders</p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">{orderStats.active}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent orders</p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">{orderStats.recentCount}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent spend</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900">
                  {formatMoney(orderStats.totalSpent)}
                </p>
              </div>
            </div>
          )}

          <div className={skin ? `${skin}-acct-actions` : 'mb-8 flex flex-wrap gap-3'}>
            <Link href={shopHref} className={t.btnPrimary}>
              {shopLabel}
            </Link>
            {!isTradePro ? (
              <Link href="/orders/track" className={t.btnSecondary}>
                Track an order
              </Link>
            ) : (
              <Link href="/account/orders" className={t.btnSecondary}>
                View enquiries
              </Link>
            )}
            {skin !== 'mf' ? (
              <Link href="/account/profile" className={t.btnSecondary}>
                Edit profile
              </Link>
            ) : null}
          </div>

          {!skin && profile ? (
            <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Account</p>
              <p className="mt-2 font-medium text-neutral-900">
                {profile.firstName} {profile.lastName ?? ''}
              </p>
              <p className={t.textMuted}>{profile.email}</p>
              {profile.phone ? <p className={t.textMuted}>{profile.phone}</p> : null}
            </div>
          ) : null}

          {(skin === 'bb' || skin === 'le') && profile ? (
            <div className={`${skin}-acct-profile-card`}>
              <p className={`${skin}-acct-stat-label`}>Account</p>
              <p className={`${skin}-acct-profile-name`}>
                {profile.firstName} {profile.lastName ?? ''}
              </p>
              <p className={t.textMuted}>{profile.email}</p>
              {profile.phone ? <p className={t.textMuted}>{profile.phone}</p> : null}
            </div>
          ) : null}

          <section className={skin ? `${skin}-acct-section` : undefined}>
            <div className={skin ? `${skin}-acct-section-head` : 'mb-4 flex items-center justify-between gap-3'}>
              <h2 className={skin ? `${skin}-acct-section-title` : 'text-lg font-semibold text-neutral-900'}>
                {isTradePro ? 'Recent enquiries' : 'Recent orders'}
              </h2>
              <Link href="/account/orders" className={t.link}>
                View all
              </Link>
            </div>

            {isTradePro ? (
              enquiries.length === 0 ? (
                <div className={t.emptyState}>
                  <p className={t.emptyTitle}>No enquiries yet</p>
                  <p className={`${t.textMuted} mt-1`}>
                    When you send an enquiry while signed in, it will show up here.
                  </p>
                  <Link href="/services" className={`${t.btnPrimary} ${t.btnBlock} mt-4`}>
                    Browse services
                  </Link>
                </div>
              ) : (
                <ul className={t.orderList}>
                  {enquiries.map((enquiry) => (
                    <li key={enquiry.id}>
                      <Link href="/account/orders" className={`${t.orderCard} block no-underline`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-900">{enquiry.name}</p>
                            <p className={t.orderMeta}>{formatDate(enquiry.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {enquiry.amount > 0 ? (
                              <p className="font-medium text-neutral-900">
                                {formatMoney(enquiry.amount, enquiry.currency || 'INR')}
                              </p>
                            ) : null}
                            <OrderStatusBadge status={enquiryStageLabel(enquiry.stage)} />
                          </div>
                        </div>
                        {enquiry.services.length > 0 ? (
                          <ul className={t.orderItems}>
                            {enquiry.services.slice(0, 2).map((item, idx) => (
                              <li key={`${enquiry.id}-${idx}`}>
                                {item.quantity}× {item.name}
                              </li>
                            ))}
                            {enquiry.services.length > 2 ? (
                              <li className="text-neutral-400">+{enquiry.services.length - 2} more</li>
                            ) : null}
                          </ul>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : orders.length === 0 ? (
              <div className={t.emptyState}>
                <p className={t.emptyTitle}>No orders yet</p>
                <p className={`${t.textMuted} mt-1`}>When you place an order while signed in, it will show up here.</p>
                <Link href="/" className={`${t.btnPrimary} ${t.btnBlock} mt-4`}>
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className={t.orderList}>
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link href="/account/orders" className={`${t.orderCard} block no-underline`}>
                      <div className={skin ? `${skin}-acct-order-row` : 'flex flex-wrap items-start justify-between gap-3'}>
                        <div>
                          <p className={skin ? `${skin}-acct-order-num` : 'font-medium text-neutral-900'}>
                            {order.orderNumber}
                          </p>
                          <p className={t.orderMeta}>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className={skin ? `${skin}-acct-order-row-end` : 'flex flex-col items-end gap-2'}>
                          <p className={skin ? `${skin}-acct-order-amount` : 'font-medium text-neutral-900'}>
                            {formatMoney(order.totalAmount)}
                          </p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </div>
                      <ul className={t.orderItems}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <li key={`${order.id}-${idx}`}>
                            {item.quantity}× {item.name}
                          </li>
                        ))}
                        {order.items.length > 2 ? (
                          <li className={skin ? `${skin}-acct-muted` : 'text-neutral-400'}>
                            +{order.items.length - 2} more
                          </li>
                        ) : null}
                      </ul>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </RequireStorefrontAuth>
  )
}
