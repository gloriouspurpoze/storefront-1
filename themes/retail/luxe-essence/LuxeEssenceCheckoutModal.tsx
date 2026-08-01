'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { SignedInCheckoutNote } from '@/components/CheckoutContactNote'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import {
  formatDeliveryNotes,
  showPreferredDateOfDelivery,
  showPreferredTimeOfDelivery,
  validateDeliveryDetails,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { getOrderingAvailabilityFromConfig, getOrderingHoursFromConfig } from '@/lib/orderingHours'
import { cartLineKey } from '@/lib/productVariants'
import { getCartShippingDisplayLabel } from '@/lib/shippingPolicy'
import {
  getEnabledPaymentMethods,
  STOREFRONT_PAYMENT_METHOD_LABELS,
  STOREFRONT_PAYMENT_SUBMIT_LABELS,
  type StorefrontPaymentMethod,
} from '@/lib/storefrontPaymentMethods'
import { useShippingPolicyCheckoutGate, validateBeforePayment } from '@/lib/useShippingPolicyCheckoutGate'
import { useStoreStatus } from '@/components/StoreStatusBadge'
import { formatMoney, type CartLine } from '../cart'
import type { ThemeTenant } from '../types'

function CheckoutSuccessIcon() {
  return (
    <svg
      className="le-success-icon"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
    >
      <circle cx="28" cy="28" r="28" fill="var(--le-soft)" />
      <path
        d="M18 28.5 24.5 35 38 21.5"
        stroke="var(--le-dark)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LuxeEssenceCheckoutModal({
  open,
  onBackToCart,
  onClose,
  tenant,
  config,
  lines,
  subtotal,
  onClearCart,
}: {
  open: boolean
  onBackToCart: () => void
  onClose: () => void
  tenant: ThemeTenant
  config: StorefrontConfig | null
  lines: CartLine[]
  subtotal: number
  onClearCart: () => void
}) {
  const themeKey = config?.themeKey ?? 'luxe-essence'
  const showPreferredDate = showPreferredDateOfDelivery(config, themeKey)
  const showPreferredTime = showPreferredTimeOfDelivery(config, themeKey)
  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const shippingLabel = useMemo(() => getCartShippingDisplayLabel(config), [config])
  const paymentMethods = useMemo(() => getEnabledPaymentMethods(config), [config])
  const { isOpen: storeOpen } = useStoreStatus(config)
  const currency = lines[0]?.currency ?? 'INR'

  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const [paymentMethod, setPaymentMethod] = useState<StorefrontPaymentMethod>(paymentMethods[0] ?? 'razorpay')

  const hasScheduledDate =
    showPreferredDate && Boolean(deliveryDetails.preferredDate?.trim())
  const checkoutBlockedByHours = !storeOpen && !hasScheduledDate

  const { requestCheckout, modal: policyModal } = useShippingPolicyCheckoutGate(config, themeKey)
  const {
    email: prefillEmail,
    name: prefillName,
    phone: prefillPhone,
    lockedEmail,
    user,
    accessToken,
    isReady,
  } = useCheckoutCustomerPrefill()

  useEffect(() => {
    if (!paymentMethods.includes(paymentMethod)) {
      setPaymentMethod(paymentMethods[0] ?? 'razorpay')
    }
  }, [paymentMethod, paymentMethods])

  useEffect(() => {
    if (!isReady) return
    if (prefillEmail && !email) setEmail(prefillEmail)
    if (prefillName && !name) setName(prefillName)
    if (prefillPhone && !phone) setPhone(prefillPhone)
  }, [isReady, prefillEmail, prefillName, prefillPhone, email, name, phone])

  useEffect(() => {
    if (open) return
    setOrderNumber(null)
    setError(null)
    setLoading(false)
  }, [open])

  const processPayment = async () => {
    if (!lines.length || loading) return

    const contact = resolveCheckoutContactForSubmit({
      formEmail: email,
      formName: name,
      formPhone: phone,
      authUser: user,
    })
    if (!contact.ok) {
      setError(contact.message)
      return
    }

    const guardMessage = validateBeforePayment(config, deliveryDetails, {
      requireDate: showPreferredDate,
      requireTime: showPreferredTime,
    })
    if (guardMessage) {
      setError(guardMessage)
      return
    }

    if (showPreferredDate || showPreferredTime) {
      const slotCheck = validateDeliveryDetails(deliveryDetails, orderingHours, {
        requireDate: showPreferredDate,
        requireTime: showPreferredTime,
        availability: orderingAvailability,
      })
      if (!slotCheck.ok) {
        setError(slotCheck.message)
        return
      }
    }

    const { email: trimmedEmail, name: trimmedName, phone: trimmedPhone } = contact

    setError(null)
    setLoading(true)
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
        customer: { email: trimmedEmail, name: trimmedName, phone: trimmedPhone },
        notes: formatDeliveryNotes(deliveryDetails),
        deliveryDetails,
        accessToken,
        paymentMethod,
      })
      onClearCart()
      setOrderNumber(result.orderNumber)
      setSuccessEmail(trimmedEmail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = loading
    ? 'Processing…'
    : STOREFRONT_PAYMENT_SUBMIT_LABELS[paymentMethod] ?? 'Place order'

  if (!open) return policyModal

  return (
    <>
      {policyModal}
      <div
        className="le-modal le-checkout-modal open"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        <RequireStorefrontAuth returnPath="/" title="Sign in to checkout">
          {!orderNumber ? (
            <>
              <div className="le-checkout-modal__head">
                <h2 className="le-checkout-modal__title">Checkout</h2>
                <button
                  type="button"
                  className="le-cart-modal__close"
                  aria-label="Close checkout"
                  onClick={onClose}
                >
                  ×
                </button>
              </div>
              <p className="le-checkout-modal__subtitle">
                Almost there — fill in your details below.
              </p>

              {!storeOpen ? (
                <p className="le-checkout-closed" role="status">
                  Ordering is unavailable right now. Please try again during store hours.
                </p>
              ) : null}

              <div className="le-order-summary">
                <div className="le-form-section-title" style={{ marginTop: 0 }}>
                  Order summary
                </div>
                {lines.map((line) => (
                  <div key={cartLineKey(line.productId, line.variantId)} className="le-order-line">
                    <span>
                      {line.name} ×{line.quantity}
                    </span>
                    <span>{formatMoney(line.price * line.quantity, line.currency)}</span>
                  </div>
                ))}
                <div className="le-order-line">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="le-order-line le-order-line--shipping">
                  <span>Shipping</span>
                  <span className="le-cart-shipping-label">{shippingLabel}</span>
                </div>
                <div className="le-order-line total">
                  <span>Total due now</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
              </div>

              <div className="le-form-section-title">Contact</div>
              {lockedEmail && prefillEmail ? (
                <SignedInCheckoutNote email={prefillEmail} className="le-checkout-signed-in" />
              ) : null}
              <div className="le-form-group">
                <label htmlFor="le-checkout-name">Full name</label>
                <input
                  id="le-checkout-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              {!lockedEmail ? (
                <div className="le-form-group">
                  <label htmlFor="le-checkout-email">Email</label>
                  <input
                    id="le-checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
              ) : null}
              <div className="le-form-group">
                <label htmlFor="le-checkout-phone">Phone</label>
                <input
                  id="le-checkout-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>

              <div className="le-form-section-title">Delivery</div>
              <DeliveryDetailsSection
                value={deliveryDetails}
                onChange={setDeliveryDetails}
                showPreferredDate={showPreferredDate}
                showPreferredTime={showPreferredTime}
                orderingHours={orderingHours}
                orderingAvailability={orderingAvailability}
                variant="plain"
              />

              {paymentMethods.length > 1 ? (
                <fieldset className="le-payment-methods">
                  <legend className="le-form-section-title">Payment</legend>
                  <div className="le-payment-options">
                    {paymentMethods.map((method) => (
                      <label
                        key={method}
                        className={`le-payment-option${paymentMethod === method ? ' le-payment-option--active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="le-payment-method"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                        />
                        <span>{STOREFRONT_PAYMENT_METHOD_LABELS[method]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {error ? <p className="le-checkout-error">{error}</p> : null}

              <button
                type="button"
                className="le-checkout-btn"
                disabled={loading || !lines.length || checkoutBlockedByHours}
                onClick={() => requestCheckout(() => void processPayment())}
              >
                {checkoutBlockedByHours ? 'Store closed' : submitLabel}
              </button>
              <button type="button" className="le-close-btn" onClick={onBackToCart}>
                Back to cart
              </button>
            </>
          ) : (
            <div className="le-success-screen">
              <CheckoutSuccessIcon />
              <h2 className="le-success-title">Order placed</h2>
              <p className="le-success-sub">
                Thank you for your order. We will email you confirmation shortly.
              </p>
              <div className="le-order-summary">
                <p className="le-success-order">Order {orderNumber}</p>
                <Link
                  href={
                    successEmail
                      ? `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(successEmail)}`
                      : `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`
                  }
                  className="le-success-track"
                >
                  Track this order
                </Link>
              </div>
              <button type="button" className="le-checkout-btn" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          )}
        </RequireStorefrontAuth>
      </div>
    </>
  )
}
