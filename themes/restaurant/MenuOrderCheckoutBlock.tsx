'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { getOrderingAvailabilityFromConfig, getOrderingHoursFromConfig } from '@/lib/orderingHours'
import { hasShippableDeliveryDetails } from '@/lib/storefrontShippingAddress'
import {
  formatDeliveryNotes,
  showPreferredTimeOfDelivery,
  validateDeliveryDetails,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import type { ThemeTenant } from './types'
import { useShippingPolicyCheckoutGate, validateBeforePayment } from '@/lib/useShippingPolicyCheckoutGate'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import {
  getEnabledPaymentMethods,
  STOREFRONT_PAYMENT_METHOD_LABELS,
  STOREFRONT_PAYMENT_SUBMIT_LABELS,
  type StorefrontPaymentMethod,
} from '@/lib/storefrontPaymentMethods'

export function MenuOrderCheckoutBlock({
  tenant,
  config,
  lines,
  notes,
  showPreferredDate = false,
  showDeliveryDetails = true,
  deliveryDetails: deliveryDetailsProp,
  onDeliveryDetailsChange,
  fulfillmentMode,
  onSuccess,
  onClear,
  primaryLabel = 'Pay & place order',
  className,
  appearance = 'default',
  authReturnPath = '/checkout',
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  lines: Array<{ productId: string; quantity: number; variantId?: string }>
  notes?: string
  showPreferredDate?: boolean
  showDeliveryDetails?: boolean
  /** When set, address is collected by the parent theme (e.g. Saffron cart) but still sent on verify. */
  deliveryDetails?: DeliveryDetailsValue
  onDeliveryDetailsChange?: (next: DeliveryDetailsValue) => void
  /** Explicit fulfillment mode from parent cart (delivery / pickup / ship). */
  fulfillmentMode?: string
  onSuccess: (orderNumber: string) => void
  onClear: () => void
  primaryLabel?: string
  className?: string
  appearance?: 'default' | 'menufast-cards'
  authReturnPath?: string
}) {
  const [internalDetails, setInternalDetails] = useState<DeliveryDetailsValue>({})
  const isControlled = deliveryDetailsProp !== undefined
  const deliveryDetails = isControlled ? deliveryDetailsProp : internalDetails
  const setDeliveryDetails = isControlled
    ? (next: DeliveryDetailsValue) => onDeliveryDetailsChange?.(next)
    : setInternalDetails

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const paymentMethods = useMemo(() => getEnabledPaymentMethods(config ?? null), [config])
  const [paymentMethod, setPaymentMethod] = useState<StorefrontPaymentMethod>(paymentMethods[0] ?? 'razorpay')
  const { requestCheckout, modal } = useShippingPolicyCheckoutGate(config)
  const showPreferredTime = showPreferredTimeOfDelivery(config, config?.themeKey)
  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const {
    accessToken,
    email: prefillEmail,
    name: prefillName,
    phone: prefillPhone,
    deliveryDetails: prefillDelivery,
    isReady,
  } = useCheckoutCustomerPrefill()

  const shouldCollectAddress = showDeliveryDetails || isControlled
  const shouldPersistShipping =
    shouldCollectAddress && hasShippableDeliveryDetails(deliveryDetails)

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
    if (!isReady || isControlled) return
    setInternalDetails((prev) => {
      if (hasShippableDeliveryDetails(prev)) return prev
      if (!hasShippableDeliveryDetails(prefillDelivery)) return prev
      return { ...prev, ...prefillDelivery }
    })
  }, [isReady, prefillDelivery, isControlled])

  const disabled = loading || lines.length === 0

  const processPayment = async () => {
    if (disabled) return
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email.')
      return
    }
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }

    const guardMessage = validateBeforePayment(config, deliveryDetails, {
      requireDate: showPreferredDate,
      requireTime: showPreferredTime,
      requireAddress: shouldCollectAddress,
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

    setError(null)
    setLoading(true)
    try {
      const orderNotes = showDeliveryDetails
        ? formatDeliveryNotes(deliveryDetails, notes)
        : notes
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines,
        customer: { email: trimmedEmail, name: trimmedName, phone: phone.trim() || undefined },
        notes: orderNotes,
        deliveryDetails: shouldPersistShipping ? deliveryDetails : undefined,
        fulfillmentMode:
          fulfillmentMode ?? (shouldPersistShipping ? 'delivery' : 'pickup'),
        accessToken,
        paymentMethod,
      })
      onClear()
      onSuccess(result.orderNumber)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onPay = () => {
    requestCheckout(() => void processPayment())
  }

  if (lines.length === 0) return null

  const submitLabel = loading
    ? 'Processing…'
    : STOREFRONT_PAYMENT_SUBMIT_LABELS[paymentMethod] ?? primaryLabel

  const isCards = appearance === 'menufast-cards'
  const rootClass = isCards ? 'mf-cards-checkout' : className
  const inputProps = isCards
    ? { className: 'mf-cards-checkout-field' }
    : { style: fieldStyle }
  const payBtnProps = isCards
    ? { className: 'mf-cards-checkout-submit' }
    : { style: payBtnStyle }

  return (
    <RequireStorefrontAuth returnPath={authReturnPath}>
      <>
        {modal}
        <div
          className={rootClass}
          style={isCards ? undefined : { display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {paymentMethods.length > 1 && (
            <fieldset
              className={isCards ? 'mf-cards-checkout-payment' : 'mf-payment-methods'}
              style={isCards ? undefined : { border: 'none', padding: 0, margin: 0 }}
            >
              <legend className={isCards ? 'mf-cards-checkout-label' : undefined} style={isCards ? undefined : { fontSize: '12px', color: '#666', marginBottom: '0.35rem' }}>
                Payment
              </legend>
              <div
                className={isCards ? 'mf-cards-checkout-payment-options' : undefined}
                style={isCards ? undefined : { display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
              >
                {paymentMethods.map((method) => (
                  <label
                    key={method}
                    className={
                      isCards
                        ? `mf-cards-checkout-payment-option${
                            paymentMethod === method ? ' mf-cards-checkout-payment-option--active' : ''
                          }`
                        : undefined
                    }
                    style={
                      isCards
                        ? undefined
                        : {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }
                    }
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className={isCards ? 'mf-cards-checkout-payment-input' : undefined}
                    />
                    <span className={isCards ? 'mf-cards-checkout-payment-indicator' : undefined} aria-hidden={isCards} />
                    <span className={isCards ? 'mf-cards-checkout-payment-label' : undefined}>
                      {STOREFRONT_PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {showDeliveryDetails && (
            <DeliveryDetailsSection
              showPreferredDate={showPreferredDate}
              showPreferredTime={showPreferredTime}
              value={deliveryDetails}
              onChange={setDeliveryDetails}
              variant={isCards ? 'menufast' : 'plain'}
              orderingHours={orderingHours}
              orderingAvailability={orderingAvailability}
            />
          )}
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...inputProps}
            autoComplete="email"
          />
          <input
            type="text"
            placeholder="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            {...inputProps}
            autoComplete="name"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            {...inputProps}
            autoComplete="tel"
          />
          {error ? (
            <p className={isCards ? 'mf-cards-checkout-error' : undefined} style={isCards ? undefined : { fontSize: '12px', color: '#c62828', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button type="button" onClick={onPay} disabled={disabled} {...payBtnProps}>
            {submitLabel}
          </button>
        </div>
      </>
    </RequireStorefrontAuth>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(26,23,20,0.15)',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'inherit',
}

const payBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '10px',
  background: '#C4633A',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
