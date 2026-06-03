'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { fetchPublicOrderTracking, type PublicOrderTracking } from '@/lib/storefront-api'
import { resolveTrackingUrl } from '@/lib/carrierTracking'
import type { ThemeTenant } from './types'

function formatWhen(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function TrackOrderClient({ tenant }: { tenant: ThemeTenant }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicOrderTracking | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await fetchPublicOrderTracking({
        tenantId: tenant.id,
        orderNumber,
        email,
      })
      if (!data) {
        setError('No order found for that number and email.')
        return
      }
      setResult(data)
    } catch {
      setError('Could not look up your order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const trackUrl =
    result &&
    resolveTrackingUrl({
      carrier: result.carrier as Parameters<typeof resolveTrackingUrl>[0]['carrier'],
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
    })

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Enter the order number from your confirmation email and the email you used at checkout.
        </p>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Order number</span>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
            placeholder="ORD-…"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
          />
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          {loading ? 'Looking up…' : 'Track order'}
        </button>
      </form>

      {result ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order status</p>
          <h2 className="mt-1 text-2xl font-bold capitalize text-slate-900">{result.status}</h2>
          <p className="mt-1 font-mono text-sm text-slate-600">{result.orderNumber}</p>

          <dl className="mt-6 space-y-3 text-sm">
            {result.carrierLabel ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Carrier</dt>
                <dd className="font-medium text-slate-900">{result.carrierLabel}</dd>
              </div>
            ) : null}
            {result.trackingNumber ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tracking</dt>
                <dd className="font-mono font-medium text-slate-900">{result.trackingNumber}</dd>
              </div>
            ) : null}
            {result.shippedAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Shipped</dt>
                <dd>{formatWhen(result.shippedAt)}</dd>
              </div>
            ) : null}
            {result.deliveredAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Delivered</dt>
                <dd>{formatWhen(result.deliveredAt)}</dd>
              </div>
            ) : null}
            {result.estimatedDeliveryAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Est. delivery</dt>
                <dd>{formatWhen(result.estimatedDeliveryAt)}</dd>
              </div>
            ) : null}
          </dl>

          {trackUrl ? (
            <a
              href={trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--site-brand)' }}
            >
              Open carrier tracking
            </a>
          ) : null}

          {result.statusHistory && result.statusHistory.length > 0 ? (
            <ul className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {[...result.statusHistory]
                .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                .map((h, i) => (
                  <li key={`${h.at}-${i}`} className="flex justify-between gap-2">
                    <span className="capitalize text-slate-800">{h.status}</span>
                    <span className="text-slate-500">{formatWhen(h.at)}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/products" className="font-medium text-indigo-600 hover:underline">
          Continue shopping
        </Link>
      </p>
    </div>
  )
}
