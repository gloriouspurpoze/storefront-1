'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { formatDeliveryNotes, type DeliveryDetailsValue } from '@/lib/templateSettings'
import { formatMoney, useCart } from './cart'
import type { ThemeTenant } from './types'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success'; orderNumber: string }
  | { kind: 'error'; message: string }

export function RestaurantCheckoutClient({
  tenant,
  showPreferredDate = false,
}: {
  tenant: ThemeTenant
  showPreferredDate?: boolean
}) {
  const { lines, subtotal, setQuantity, removeLine, clear, itemCount } = useCart()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})

  const onPay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'processing' || !lines.length) return

    const form = new FormData(e.currentTarget)
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

    setStatus({ kind: 'processing' })
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { email, name, phone: phone || undefined },
        notes: formatDeliveryNotes(deliveryDetails),
      })
      clear()
      setStatus({ kind: 'success', orderNumber: result.orderNumber })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Checkout failed. Please try again.',
      })
    }
  }

  if (status.kind === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-emerald-900">Thank you for your order</h2>
        <p className="mt-2 text-sm text-emerald-800">
          {status.orderNumber
            ? `Order ${status.orderNumber} confirmed. We emailed your receipt.`
            : 'Payment received. We emailed your confirmation.'}
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-flex rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Back to menu
        </Link>
      </div>
    )
  }

  if (!lines.length) {
    return (
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
    )
  }

  const currency = lines[0]?.currency ?? 'INR'

  return (
    <form onSubmit={(e) => void onPay(e)} className="grid gap-8 lg:grid-cols-2">
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
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <input
            name="name"
            type="text"
            required
            placeholder="Full name"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone (optional)"
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
  )
}
