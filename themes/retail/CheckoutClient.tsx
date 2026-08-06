'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import { hasShippableDeliveryDetails } from '@/lib/storefrontShippingAddress'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import {
  formatDeliveryNotes,
  showPreferredTimeOfDelivery,
  validateDeliveryDetails,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { getOrderingAvailabilityFromConfig, getOrderingHoursFromConfig } from '@/lib/orderingHours'
import { cartLineKey } from '@/lib/productVariants'
import { formatMoney, useCart } from './cart'
import type { ThemeTenant } from './types'
import { useShippingPolicyCheckoutGate, validateBeforePayment } from '@/lib/useShippingPolicyCheckoutGate'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import './retail-cart.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success'; orderNumber?: string; email?: string }
  | { kind: 'error'; message: string }

function trackOrderHref(orderNumber?: string, email?: string): string {
  if (!orderNumber) return '/orders/track'
  const params = new URLSearchParams({ orderNumber })
  if (email?.trim()) params.set('email', email.trim().toLowerCase())
  return `/orders/track?${params.toString()}`
}

function LuxeCartEmptyIcon() {
  return (
    <svg
      className="le-cart-empty-icon"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" />
      <circle cx="9.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

function themeRootClass(themeKey?: string): string {
  if (themeKey === 'soft-studio') return 'ss-root sf-checkout-page'
  if (themeKey === 'luxe-essence') return 'le-root sf-checkout-page'
  return 'sf-checkout-page'
}

export function CheckoutClient({
  tenant,
  config,
  showPreferredDate = false,
  themeKey,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  showPreferredDate?: boolean
  themeKey?: string
}) {
  const { lines, subtotal, clear, itemCount } = useCart()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const { requestCheckout, modal } = useShippingPolicyCheckoutGate(config, themeKey)
  const showPreferredTime = showPreferredTimeOfDelivery(config, config?.themeKey ?? themeKey ?? 'classic')
  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const {
    email: prefillEmail,
    name: prefillName,
    phone: prefillPhone,
    deliveryDetails: prefillDelivery,
    lockedEmail,
    user,
    accessToken,
    isReady,
  } = useCheckoutCustomerPrefill()

  useEffect(() => {
    if (!isReady) return
    if (prefillEmail && !email) setEmail(prefillEmail)
    if (prefillName && !name) setName(prefillName)
    if (prefillPhone && !phone) setPhone(prefillPhone)
  }, [isReady, prefillEmail, prefillName, prefillPhone, email, name, phone])

  useEffect(() => {
    if (!isReady) return
    setDeliveryDetails((prev) => {
      if (hasShippableDeliveryDetails(prev)) return prev
      if (!hasShippableDeliveryDetails(prefillDelivery)) return prev
      return { ...prev, ...prefillDelivery }
    })
  }, [isReady, prefillDelivery])

  const processPayment = async () => {
    const contact = resolveCheckoutContactForSubmit({
      formEmail: email,
      formName: name,
      formPhone: phone,
      authUser: user,
    })
    if (!contact.ok) {
      setStatus({ kind: 'error', message: contact.message })
      return
    }

    const guardMessage = validateBeforePayment(config, deliveryDetails, {
      requireDate: showPreferredDate,
      requireTime: showPreferredTime,
    })
    if (guardMessage) {
      setStatus({ kind: 'error', message: guardMessage })
      return
    }

    if (showPreferredDate || showPreferredTime) {
      const slotCheck = validateDeliveryDetails(deliveryDetails, orderingHours, {
        requireDate: showPreferredDate,
        requireTime: showPreferredTime,
        availability: orderingAvailability,
      })
      if (!slotCheck.ok) {
        setStatus({ kind: 'error', message: slotCheck.message })
        return
      }
    }

    setStatus({ kind: 'processing' })
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          variantId: l.variantId,
        })),
        customer: {
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
        },
        notes: formatDeliveryNotes(deliveryDetails),
        deliveryDetails,
        accessToken,
      })
      clear()
      setStatus({
        kind: 'success',
        orderNumber: result.orderNumber,
        email: contact.email,
      })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Checkout failed. Please try again.',
      })
    }
  }

  const onPay = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'processing' || !lines.length) return
    requestCheckout(() => void processPayment())
  }

  const rootClass = themeRootClass(themeKey)
  const currency = lines[0]?.currency ?? 'INR'
  const isLuxe = themeKey === 'luxe-essence'
  const trustCopy = isLuxe
    ? 'Secure payment via Razorpay · Prices verified on our server'
    : '🔒 Secure payment via Razorpay · Prices verified on our server'

  if (status.kind === 'success') {
    return (
      <RequireStorefrontAuth returnPath="/checkout">
        <>
          {modal}
          <div className={`${rootClass} sf-checkout-success`}>
            <h2>Thank you for your order</h2>
            <p>
              Payment received.
              {status.orderNumber ? ` Order ${status.orderNumber}.` : ''} We will email you confirmation and
              tracking when your order ships.
            </p>
            <div className="sf-checkout-success-actions">
              <Link
                href={trackOrderHref(status.orderNumber, status.email)}
                className="sf-cart-cta-primary"
              >
                Track your order
              </Link>
              <Link
                href={
                  status.orderNumber
                    ? `/account/orders?orderNumber=${encodeURIComponent(status.orderNumber)}`
                    : '/account/orders'
                }
                className="sf-cart-cta-secondary"
              >
                View order history
              </Link>
              <Link href="/products" className="sf-cart-cta-secondary">
                Continue shopping
              </Link>
            </div>
          </div>
        </>
      </RequireStorefrontAuth>
    )
  }

  if (!lines.length) {
    return (
      <RequireStorefrontAuth returnPath="/checkout">
        <>
          {modal}
          <div className={`${rootClass} sf-cart-empty`}>
            <div className="sf-cart-empty-icon" aria-hidden>
              {isLuxe ? <LuxeCartEmptyIcon /> : '🛒'}
            </div>
            <h2 className="sf-cart-empty-title">Nothing to checkout</h2>
            <p className="sf-cart-empty-sub">Your cart is empty. Add items before checking out.</p>
            <Link href="/products" className="sf-cart-cta-primary">
              Browse products
            </Link>
          </div>
        </>
      </RequireStorefrontAuth>
    )
  }

  return (
    <RequireStorefrontAuth returnPath="/checkout">
      <>
        {modal}
        <div className={rootClass}>
        <div className="sf-checkout-layout">
          <form onSubmit={onPay} className="sf-checkout-form">
            <p className="sf-checkout-back">
              <Link href="/cart">← Back to cart</Link>
            </p>

            <h2 className="sf-checkout-section-title">Contact</h2>
            <label className="sf-checkout-field">
              <span>Full name</span>
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            {!lockedEmail ? (
              <label className="sf-checkout-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            ) : null}
            <label className="sf-checkout-field">
              <span>Phone</span>
              <input
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
            </label>

            <h2 className="sf-checkout-section-title">Delivery</h2>
            <DeliveryDetailsSection
              showPreferredDate={showPreferredDate}
              showPreferredTime={showPreferredTime}
              value={deliveryDetails}
              onChange={setDeliveryDetails}
              orderingHours={orderingHours}
              orderingAvailability={orderingAvailability}
              variant="plain"
            />

            {status.kind === 'error' ? <p className="sf-checkout-error">{status.message}</p> : null}

            <button
              type="submit"
              disabled={status.kind === 'processing'}
              className="sf-cart-cta-primary sf-cart-cta-block sf-checkout-pay-btn"
            >
              {status.kind === 'processing' ? 'Processing…' : `Pay ${formatMoney(subtotal, currency)}`}
            </button>
            <p className="sf-cart-trust">{trustCopy}</p>
          </form>

          <aside className="sf-cart-summary sf-checkout-summary" aria-label="Order summary">
            <h2 className="sf-cart-summary-title">Order summary</h2>
            <p className="sf-cart-summary-count">
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </p>
            <ul className="sf-checkout-summary-lines">
              {lines.map((line) => (
                <li key={cartLineKey(line.productId, line.variantId)} className="sf-checkout-summary-line">
                  <span>
                    {line.name} ×{line.quantity}
                  </span>
                  <span>{formatMoney(line.price * line.quantity, line.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="sf-cart-summary-row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <p className="sf-cart-summary-note">Shipping calculated after payment confirmation.</p>
            <Link href="/cart" className="sf-cart-cta-secondary">
              Edit cart
            </Link>
          </aside>
        </div>
      </div>
      </>
    </RequireStorefrontAuth>
  )
}
