'use client'

import { useState, type FormEvent } from 'react'
import { submitLead } from '@/lib/storefront-api'

interface ReservationFormProps {
  tenantId: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deduped: boolean }
  | { kind: 'error'; message: string }

export function ReservationForm({ tenantId }: ReservationFormProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return

    const form = new FormData(e.currentTarget)
    const firstName = String(form.get('firstName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const phone = String(form.get('phone') ?? '').trim()
    const date = String(form.get('date') ?? '').trim()
    const time = String(form.get('time') ?? '').trim()
    const partySize = String(form.get('partySize') ?? '').trim()
    const notes = String(form.get('notes') ?? '').trim()

    if (!firstName) {
      setStatus({ kind: 'error', message: 'Please tell us your name.' })
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email.' })
      return
    }

    const message = [
      'Table reservation request',
      date ? `Date: ${date}` : null,
      time ? `Time: ${time}` : null,
      partySize ? `Party size: ${partySize}` : null,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    setStatus({ kind: 'submitting' })
    try {
      const result = await submitLead({
        tenantId,
        firstName,
        email,
        phone,
        message,
        source: 'storefront-reservation',
      })
      setStatus({ kind: 'success', deduped: result.deduped })
      e.currentTarget.reset()
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Name</span>
          <input
            name="firstName"
            required
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Phone</span>
          <input
            name="phone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Party size</span>
          <select
            name="partySize"
            defaultValue="2"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={String(n)}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Date</span>
          <input
            name="date"
            type="date"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Time</span>
          <input
            name="time"
            type="time"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-stone-700">Special requests</span>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-amber-200 focus:ring-2"
          placeholder="Allergies, celebrations, seating preference…"
        />
      </label>

      {status.kind === 'success' ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {status.deduped
            ? 'We already have your request — our team will confirm shortly.'
            : 'Thank you! We will confirm your reservation by email.'}
        </p>
      ) : null}
      {status.kind === 'error' ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{status.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        className="w-full rounded-full py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: 'var(--site-brand)' }}
      >
        {status.kind === 'submitting' ? 'Sending…' : 'Request reservation'}
      </button>
    </form>
  )
}
