'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  createCheckoutOrder,
  verifyCheckout,
} from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import {
  formatDeliveryNotes,
  showPreferredTimeOfDelivery,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { openRazorpayCheckout } from '@/lib/razorpayCheckout'
import { formatMoney, useCart } from './cart'
import type { ThemeTenant } from './types'
import { useShippingPolicyCheckoutGate, validateBeforePayment } from '@/lib/useShippingPolicyCheckoutGate'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function CheckoutClient({
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

  const processPayment = async (form: FormData) => {
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const name = String(form.get('name') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email.' })
      return
    }
    if (!name) {
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
      const order = await createCheckoutOrder({
        tenantId: tenant.id,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customerEmail: email,
        customerName: name,
        notes: formatDeliveryNotes(deliveryDetails),
      })

      const payment = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        name: tenant.name,
        description: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
        prefill: { email, name, contact: phone || undefined },
        themeColor: tenant.brand,
      })

      await verifyCheckout({
        tenantId: tenant.id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        customerEmail: email,
        customerName: name,
        phone,
      })

      clear()
      setStatus({ kind: 'success' })
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
    const form = new FormData(e.currentTarget)
    requestCheckout(() => void processPayment(form))
  }

  if (status.kind === 'success') {
    return (
      <>
        {modal}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-900">Thank you for your order</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Payment received. We will email you confirmation and tracking when your order ships.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/orders/track"
              className="inline-flex rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Track your order
            </Link>
            <Link
              href="/products"
              className="inline-flex rounded-full border border-emerald-700 px-6 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </>
    )
  }

  if (!lines.length) {
    return (
      <>
        {modal}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            Browse products
          </Link>
        </div>
      </>
    )
  }

  const currency = lines[0]?.currency ?? 'INR'

  return (
    <>
      {modal}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-4 p-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${line.slug}`} className="font-medium text-slate-900 hover:underline">
                  {line.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {formatMoney(line.price, line.currency)} each
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs text-slate-500">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={line.quantity}
                      onChange={(ev) =>
                        setQuantity(line.productId, parseInt(ev.target.value, 10) || 0)
                      }
                      className="ml-1 w-14 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-semibold text-slate-900">
                {formatMoney(line.price * line.quantity, line.currency)}
              </p>
            </li>
          ))}
        </ul>

        <form onSubmit={onPay} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Total {formatMoney(subtotal, currency)}
          </p>
          <DeliveryDetailsSection
            showPreferredDate={showPreferredDate}
            value={deliveryDetails}
            onChange={setDeliveryDetails}
            variant="plain"
          />
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Phone</span>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
            />
          </label>

          {status.kind === 'error' ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{status.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={status.kind === 'processing'}
            className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            {status.kind === 'processing' ? 'Processing…' : 'Pay with Razorpay'}
          </button>
          <p className="text-center text-xs text-slate-400">
            Secure payment · Prices verified on our server
          </p>
        </form>
      </div>
    </>
  )
}
