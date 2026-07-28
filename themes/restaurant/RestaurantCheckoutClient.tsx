'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import {
  formatDeliveryNotes,
  showPreferredTimeOfDelivery,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { formatMoney, useCart } from './cart'
import type { ThemeTenant } from './types'
import { useShippingPolicyCheckoutGate, validateBeforePayment } from '@/lib/useShippingPolicyCheckoutGate'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success'; orderNumber: string; email: string }
  | { kind: 'error'; message: string }

function trackOrderHref(orderNumber: string, email: string): string {
  const params = new URLSearchParams({ orderNumber })
  if (email.trim()) params.set('email', email.trim().toLowerCase())
  return `/orders/track?${params.toString()}`
}

export function RestaurantCheckoutClient({
  tenant,
  config,
  showPreferredDate = false,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  showPreferredDate?: boolean
}) {
  const { lines, subtotal, setQuantity, removeLine, clear, itemCount } = useCart()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const { requestCheckout, modal } = useShippingPolicyCheckoutGate(config)
  const showPreferredTime = showPreferredTimeOfDelivery(config, config?.themeKey ?? 'classic')
  const { accessToken, email: prefillEmail, name: prefillName, phone: prefillPhone, isReady } =
    useCheckoutCustomerPrefill()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!isReady) return
    if (prefillEmail && !email) setEmail(prefillEmail)
    if (prefillName && !name) setName(prefillName)
    if (prefillPhone && !phone) setPhone(prefillPhone)
  }, [isReady, prefillEmail, prefillName, prefillPhone, email, name, phone])

  const processPayment = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email.' })
      return
    }
    if (!trimmedName) {
      setStatus({ kind: 'error', message: 'Please enter your name.' })
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

    setStatus({ kind: 'processing' })
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { email: trimmedEmail, name: trimmedName, phone: trimmedPhone || undefined },
        notes: formatDeliveryNotes(deliveryDetails),
        deliveryDetails,
        accessToken,
      })
      clear()
      setStatus({ kind: 'success', orderNumber: result.orderNumber, email: trimmedEmail })
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

  const wrap = (node: React.ReactNode) => (
    <RequireStorefrontAuth returnPath="/checkout">{node}</RequireStorefrontAuth>
  )

  if (status.kind === 'success') {
    return wrap(
      <>
        {modal}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-900">Thank you for your order</h2>
          <p className="mt-2 text-sm text-emerald-800">
            {status.orderNumber
              ? `Order ${status.orderNumber} confirmed. We emailed your receipt.`
              : 'Payment received. We emailed your confirmation.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={trackOrderHref(status.orderNumber, status.email)}
              className="inline-flex rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Track your order
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex rounded-full border border-emerald-300 px-6 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
            >
              View orders
            </Link>
            <Link
              href="/menu"
              className="inline-flex rounded-full border border-emerald-300 px-6 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
            >
              Back to menu
            </Link>
          </div>
        </div>
      </>,
    )
  }

  if (!lines.length) {
    return wrap(
      <>
        {modal}
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">Your cart is empty.</p>
          <Link
            href="/menu"
            className="mt-4 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            Browse menu
          </Link>
        </div>
      </>,
    )
  }

  const currency = lines[0]?.currency ?? 'INR'

  return wrap(
    <>
      {modal}
      <form onSubmit={onPay} className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">Your order</h2>
          <ul className="mt-4 divide-y divide-stone-100">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-stone-900">{line.name}</p>
                  <p className="text-sm text-stone-500">{formatMoney(line.price, line.currency)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-stone-200"
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-stone-200"
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-xs text-stone-400 hover:text-red-600"
                    onClick={() => removeLine(line.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-lg font-semibold text-stone-900">
            Total: {formatMoney(subtotal, currency)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">Contact details</h2>
          <div className="mt-4">
            <DeliveryDetailsSection
              showPreferredDate={showPreferredDate}
              value={deliveryDetails}
              onChange={setDeliveryDetails}
              variant="plain"
            />
          </div>
          <div className="mt-4 space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <input
              name="name"
              type="text"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          {status.kind === 'error' && (
            <p className="mt-3 text-sm text-red-600">{status.message}</p>
          )}
          <button
            type="submit"
            disabled={status.kind === 'processing'}
            className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            {status.kind === 'processing'
              ? 'Processing…'
              : `Pay · ${formatMoney(subtotal, currency)} (${itemCount} items)`}
          </button>
        </div>
      </form>
    </>,
  )
}
