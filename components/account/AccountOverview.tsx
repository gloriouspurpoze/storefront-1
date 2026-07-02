'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchCustomerOrders,
  fetchCustomerProfile,
  type CustomerOrderSummary,
  type CustomerProfile,
} from '@/lib/storefront-api'
import { displayName } from '@/lib/storefront-auth'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { OrderStatusBadge } from './OrderTrackingPanel'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

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

function isActiveOrder(status: string): boolean {
  const s = status.toLowerCase()
  return !['delivered', 'cancelled', 'refunded', 'completed'].includes(s)
}

export function AccountOverview({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
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

    Promise.all([
      fetchCustomerProfile({ tenantId, accessToken: tokens.accessToken }),
      fetchCustomerOrders({ tenantId, accessToken: tokens.accessToken, limit: 5 }),
    ])
      .then(([prof, orderData]) => {
        if (cancelled) return
        setProfile(prof)
        setOrders(orderData.orders)
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
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId])

  const stats = useMemo(() => {
    const active = orders.filter((o) => isActiveOrder(o.status)).length
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    return { active, totalSpent, recentCount: orders.length }
  }, [orders])

  return (
    <RequireStorefrontAuth returnPath="/account">
      <AccountPageHeader
        title={`Welcome back${user ? `, ${displayName(user).split(' ')[0]}` : ''}`}
        subtitle="Manage orders, track deliveries, and update your profile."
      />

      {loading ? (
        <p className={t.statusLoading}>Loading your dashboard…</p>
      ) : error ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Active orders</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.active}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent orders</p>
              <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.recentCount}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent spend</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{formatMoney(stats.totalSpent)}</p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link href="/" className={t.btnPrimary}>
              Shop now
            </Link>
            <Link href="/orders/track" className={t.btnSecondary}>
              Track an order
            </Link>
            <Link href="/account/profile" className={t.btnSecondary}>
              Edit profile
            </Link>
          </div>

          {profile ? (
            <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Account</p>
              <p className="mt-2 font-medium text-neutral-900">
                {profile.firstName} {profile.lastName ?? ''}
              </p>
              <p className={t.textMuted}>{profile.email}</p>
              {profile.phone ? <p className={t.textMuted}>{profile.phone}</p> : null}
            </div>
          ) : null}

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-neutral-900">Recent orders</h2>
              <Link href="/account/orders" className={t.link}>
                View all
              </Link>
            </div>

            {orders.length === 0 ? (
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900">{order.orderNumber}</p>
                          <p className={t.orderMeta}>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-medium text-neutral-900">{formatMoney(order.totalAmount)}</p>
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
                          <li className="text-neutral-400">+{order.items.length - 2} more</li>
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
