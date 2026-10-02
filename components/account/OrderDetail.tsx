'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  cancelCustomerOrder,
  fetchCustomerOrderDetail,
  fetchCustomerOrderTracking,
  type CustomerOrderDetail,
  type PublicOrderTracking,
} from '@/lib/storefront-api'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { OrderStatusBadge, OrderTrackingPanel } from './OrderTrackingPanel'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

export interface StoreContact {
  phone?: string
  email?: string
  whatsapp?: string
}

function formatMoney(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
}

function formatWhen(iso?: string, withTime = false): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(
      undefined,
      withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
    )
  } catch {
    return iso
  }
}

const PAYMENT_LABELS: Record<CustomerOrderDetail['paymentMethod'], string> = {
  razorpay: 'Paid online',
  cod: 'Cash on delivery',
  pay_at_restaurant: 'Pay at restaurant',
  other: 'Payment',
}

function paymentSummary(order: CustomerOrderDetail): string {
  const status = order.paymentStatus.toLowerCase()
  if (status === 'refunded') return `${PAYMENT_LABELS[order.paymentMethod]} · Refunded`
  if (order.paymentMethod === 'razorpay') {
    return status === 'paid' ? 'Paid online (UPI / card)' : 'Online payment pending'
  }
  return `${PAYMENT_LABELS[order.paymentMethod]} · ${status === 'paid' ? 'Paid' : 'Due on delivery'}`
}

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
}

/** Delivery orders get the full courier flow; pickup orders skip "Shipped". */
function progressSteps(isPickup: boolean): Array<{ status: string; label: string }> {
  return isPickup
    ? [
        { status: 'pending', label: 'Placed' },
        { status: 'confirmed', label: 'Confirmed' },
        { status: 'processing', label: 'Preparing' },
        { status: 'delivered', label: 'Picked up' },
      ]
    : [
        { status: 'pending', label: 'Placed' },
        { status: 'confirmed', label: 'Confirmed' },
        { status: 'processing', label: 'Packed' },
        { status: 'shipped', label: 'Shipped' },
        { status: 'delivered', label: 'Delivered' },
      ]
}

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Changed my mind',
  'Found a better price',
  'Delivery is taking too long',
  'Other',
]

/** Hides site chrome so "Print receipt" prints only the receipt block. */
const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #order-receipt, #order-receipt * { visibility: visible !important; }
  #order-receipt { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 24px; }
  .order-no-print { display: none !important; }
}`

export function OrderDetail({
  tenantId,
  orderNumber,
  storeName,
  storeContact,
  productLinks,
}: {
  tenantId: string
  orderNumber: string
  storeName: string
  storeContact: StoreContact
  /** Retail stores link items to `/products/:slug`; others reorder from the home menu. */
  productLinks: boolean
}) {
  const { tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null)
  const [tracking, setTracking] = useState<PublicOrderTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [justCancelled, setJustCancelled] = useState(false)

  const accessToken = tokens?.accessToken

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const [detail, track] = await Promise.all([
        fetchCustomerOrderDetail({ tenantId, accessToken, orderNumber }),
        fetchCustomerOrderTracking({ tenantId, accessToken, orderNumber }).catch(() => null),
      ])
      if (!detail) {
        setNotFound(true)
        return
      }
      setOrder(detail)
      setTracking(track)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this order')
    } finally {
      setLoading(false)
    }
  }, [accessToken, tenantId, orderNumber])

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated || !accessToken) {
      setLoading(false)
      return
    }
    void load()
  }, [isReady, isAuthenticated, accessToken, load])

  const confirmCancel = async () => {
    if (!accessToken || !order) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelCustomerOrder({ tenantId, accessToken, orderNumber: order.orderNumber, reason: cancelReason })
      setCancelOpen(false)
      setJustCancelled(true)
      await load()
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel this order')
    } finally {
      setCancelling(false)
    }
  }

  const helpMessage = `Hi ${storeName}, I need help with order ${orderNumber}.`
  const whatsappDigits = (storeContact.whatsapp || '').replace(/\D/g, '')
  const hasHelp = Boolean(whatsappDigits || storeContact.phone || storeContact.email)

  return (
    <RequireStorefrontAuth returnPath={`/account/orders/${encodeURIComponent(orderNumber)}`}>
      <style>{PRINT_CSS}</style>
      <Link href="/account/orders" className={`${t.backLink} order-no-print`}>
        ← All orders
      </Link>

      {loading ? (
        <p className={t.statusLoading}>Loading order…</p>
      ) : notFound ? (
        <div className={t.emptyState}>
          <p className={t.emptyTitle}>Order not found</p>
          <p className={`${t.textMuted} mt-1`}>
            We couldn’t find order {orderNumber} on this account.
          </p>
          <Link href="/account/orders" className={`${t.btnSecondary} mt-4`}>
            View your orders
          </Link>
        </div>
      ) : error ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : order ? (
        <div id="order-receipt" className="space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={t.trackingEyebrow}>Order</p>
              <h1 className={t.pageTitle}>{order.orderNumber}</h1>
              <p className={t.textMuted}>
                Placed {formatWhen(order.createdAt, true)} · {order.itemCount} item
                {order.itemCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OrderStatusBadge status={order.status} />
              <p className="text-lg font-semibold">{formatMoney(order.totalAmount)}</p>
            </div>
          </header>

          {justCancelled ? (
            <div role="status" className={t.signedInNote}>
              Your order was cancelled.
              {order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid'
                ? ` You paid online — contact ${storeName} about your refund.`
                : ''}
            </div>
          ) : null}

          <OrderProgress order={order} tracking={tracking} />

          <section className={t.card} aria-labelledby="order-items-title">
            <h2 id="order-items-title" className="mb-4 text-base font-semibold">
              Items
            </h2>
            <ul className="divide-y divide-neutral-200/70">
              {order.items.map((item, idx) => {
                const reorderHref = productLinks && item.slug ? `/products/${item.slug}` : null
                return (
                  <li key={`${item.productId ?? item.name}-${idx}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200 object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-lg font-semibold text-neutral-400"
                      >
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variantName && !item.name.includes(item.variantName) ? (
                        <p className={`${t.textMuted} text-xs`}>{item.variantName}</p>
                      ) : null}
                      <p className={`${t.textMuted} text-xs`}>
                        {item.quantity} × {formatMoney(item.price)}
                      </p>
                      {reorderHref ? (
                        <Link href={reorderHref} className={`${t.link} order-no-print mt-1 inline-block text-xs`}>
                          Buy again
                        </Link>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-medium">{formatMoney(item.total)}</p>
                  </li>
                )
              })}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-neutral-200/70 pt-4 text-sm">
              <SummaryRow label="Subtotal" value={formatMoney(order.subtotal)} muted={t.textMuted} />
              {order.shippingAddress ? (
                <SummaryRow
                  label="Delivery"
                  value={order.shippingAmount > 0 ? formatMoney(order.shippingAmount) : 'Free'}
                  muted={t.textMuted}
                />
              ) : null}
              {order.taxAmount > 0 ? (
                <SummaryRow label="Taxes" value={formatMoney(order.taxAmount)} muted={t.textMuted} />
              ) : null}
              {order.discountAmount > 0 ? (
                <SummaryRow
                  label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
                  value={`−${formatMoney(order.discountAmount)}`}
                  muted={t.textMuted}
                />
              ) : null}
              <div className="flex justify-between pt-1.5 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className={t.card}>
              <h2 className="mb-2 text-base font-semibold">Payment</h2>
              <p className={t.text}>{paymentSummary(order)}</p>
            </section>
            <section className={t.card}>
              <h2 className="mb-2 text-base font-semibold">
                {order.shippingAddress ? 'Delivery address' : 'Fulfilment'}
              </h2>
              {order.shippingAddress ? (
                <address className={`${t.text} not-italic`}>
                  {order.shippingAddress.name ? (
                    <span className="block font-medium">{order.shippingAddress.name}</span>
                  ) : null}
                  <span className="block">{order.shippingAddress.address}</span>
                  <span className="block">
                    {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                  {order.shippingAddress.phone ? (
                    <span className="block">{order.shippingAddress.phone}</span>
                  ) : null}
                </address>
              ) : (
                <p className={t.text}>Pickup from {storeName}</p>
              )}
            </section>
          </div>

          {tracking && (tracking.trackingNumber || tracking.carrier) ? (
            <section className={t.trackingPanel}>
              <OrderTrackingPanel tracking={tracking} compact />
            </section>
          ) : null}

          <section className={`${t.card} order-no-print`} aria-label="Order actions">
            <div className="flex flex-wrap gap-3">
              <button type="button" className={t.btnSecondary} onClick={() => window.print()}>
                Print receipt
              </button>
              {!productLinks ? (
                <Link href="/" className={t.btnSecondary}>
                  Order again
                </Link>
              ) : null}
              {order.cancellable && !cancelOpen ? (
                <button
                  type="button"
                  className={t.btnSecondary}
                  onClick={() => {
                    setCancelOpen(true)
                    setCancelError(null)
                  }}
                >
                  Cancel order
                </button>
              ) : null}
            </div>
            {order.cancellable && order.cancelDeadlineAt && !cancelOpen ? (
              <p className={`${t.textMuted} mt-3 text-xs`}>
                You can cancel until {formatWhen(order.cancelDeadlineAt, true)}.
              </p>
            ) : null}

            {cancelOpen ? (
              <div className="mt-4 space-y-3 rounded-xl border border-neutral-200 p-4">
                <p className="font-medium">Cancel this order?</p>
                {order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid' ? (
                  <p className={`${t.textMuted} text-xs`}>
                    You paid online. After cancelling, contact {storeName} about your refund.
                  </p>
                ) : null}
                <label htmlFor="cancel-reason" className={t.label}>
                  Reason
                </label>
                <select
                  id="cancel-reason"
                  className={t.input}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {cancelError ? (
                  <p role="alert" className={t.error}>
                    {cancelError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={t.btnPrimary}
                    disabled={cancelling}
                    onClick={() => void confirmCancel()}
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
                  </button>
                  <button
                    type="button"
                    className={t.btnSecondary}
                    disabled={cancelling}
                    onClick={() => setCancelOpen(false)}
                  >
                    Keep order
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {hasHelp ? (
            <section className={`${t.card} order-no-print`} aria-label="Help with this order">
              <h2 className="mb-1 text-base font-semibold">Need help with this order?</h2>
              <p className={`${t.textMuted} mb-3`}>Contact {storeName} and mention {order.orderNumber}.</p>
              <div className="flex flex-wrap gap-3">
                {whatsappDigits ? (
                  <a
                    href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(helpMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={t.btnSecondary}
                  >
                    WhatsApp
                  </a>
                ) : null}
                {storeContact.phone ? (
                  <a href={`tel:${storeContact.phone.replace(/\s/g, '')}`} className={t.btnSecondary}>
                    Call store
                  </a>
                ) : null}
                {storeContact.email ? (
                  <a
                    href={`mailto:${storeContact.email}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}&body=${encodeURIComponent(helpMessage)}`}
                    className={t.btnSecondary}
                  >
                    Email
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </RequireStorefrontAuth>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div className="flex justify-between">
      <dt className={muted}>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function OrderProgress({
  order,
  tracking,
}: {
  order: CustomerOrderDetail
  tracking: PublicOrderTracking | null
}) {
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const status = order.status.toLowerCase()

  if (status === 'cancelled' || status === 'refunded') {
    const entry = tracking?.statusHistory?.find((h) => h.status === status)
    return (
      <div className={t.signedInNote} role="status">
        This order was {status}
        {entry?.at ? ` on ${formatWhen(entry.at, true)}` : ''}.
        {entry?.note ? ` ${entry.note}` : ''}
      </div>
    )
  }

  const isPickup = !order.shippingAddress
  const steps = progressSteps(isPickup)
  // Pickup has no "shipped" step — treat it as still preparing.
  const rank = isPickup && status === 'shipped' ? STATUS_RANK.processing : STATUS_RANK[status] ?? 0
  const reachedAt = (s: string) =>
    s === 'pending' ? order.createdAt : tracking?.statusHistory?.find((h) => h.status === s)?.at

  return (
    <section className={t.card} aria-label="Order progress">
      <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => {
          const done = (STATUS_RANK[step.status] ?? 0) <= rank
          const current = (STATUS_RANK[step.status] ?? 0) === rank
          const when = done ? reachedAt(step.status) : undefined
          return (
            <li key={step.status} className="min-w-0" aria-current={current ? 'step' : undefined}>
              <div className="flex items-center">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? 'bg-[var(--site-brand,#171717)]' : 'bg-neutral-300'}`}
                />
                {i < steps.length - 1 ? (
                  <span
                    className={`ml-1 h-0.5 flex-1 rounded ${
                      (STATUS_RANK[steps[i + 1].status] ?? 0) <= rank
                        ? 'bg-[var(--site-brand,#171717)]'
                        : 'bg-neutral-200'
                    }`}
                  />
                ) : null}
              </div>
              <p className={`mt-2 text-xs ${done ? 'font-semibold' : t.textMuted}`}>{step.label}</p>
              {when ? <p className={`${t.textMuted} text-[11px]`}>{formatWhen(when)}</p> : null}
            </li>
          )
        })}
      </ol>
      {tracking?.estimatedDeliveryAt && status !== 'delivered' && !isPickup ? (
        <p className={`${t.textMuted} mt-4 text-xs`}>
          Estimated delivery by {formatWhen(tracking.estimatedDeliveryAt)}
        </p>
      ) : null}
    </section>
  )
}
