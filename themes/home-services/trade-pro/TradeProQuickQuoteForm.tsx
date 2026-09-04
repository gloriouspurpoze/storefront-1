'use client'

import { useState, type FormEvent } from 'react'
import { submitLead } from '@/lib/storefront-api'
import type { PublicService } from '../types'
import { CheckIcon } from './icons'
import './trade-pro.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deduped: boolean }
  | { kind: 'error'; message: string }

/**
 * Short, hero-friendly lead form — name, phone, email, and (if available) a
 * service picker. Trimmed down from `BookingForm` on purpose: a long form in
 * the hero pushes the rest of the homepage below the fold, and short forms
 * convert better for a "get a quick quote" ask.
 */
export function TradeProQuickQuoteForm({
  tenantId,
  services,
  source = 'storefront-home-hero',
}: {
  tenantId: string
  services?: PublicService[]
  source?: string
}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return

    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const phone = String(form.get('phone') ?? '').trim()
    const serviceSlug = String(form.get('serviceSlug') ?? '').trim() || undefined

    if (!name) {
      setStatus({ kind: 'error', message: 'Please share your name.' })
      return
    }
    if (!phone) {
      setStatus({ kind: 'error', message: 'Please share a phone number so we can call you back.' })
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setStatus({ kind: 'submitting' })
    try {
      const result = await submitLead({
        tenantId,
        firstName: name,
        email,
        phone,
        serviceSlug,
        source,
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

  if (status.kind === 'success') {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-7">
        <div
          className="tp-mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[var(--tp-ink)]"
          style={{ backgroundColor: 'var(--tp-accent)' }}
        >
          <CheckIcon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          {status.deduped ? "We've got you" : 'Request received'}
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">We&apos;ll call you back within one business day.</p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-4 text-sm font-semibold text-slate-500 underline-offset-4 hover:underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-900">Get a free quote</p>
      <p className="mt-1 text-sm text-slate-500">Tell us what you need — we&apos;ll call you back today.</p>

      <div className="mt-5 space-y-4">
        <QField name="name" label="Name" autoComplete="name" required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QField name="phone" type="tel" label="Phone" autoComplete="tel" required />
          <QField name="email" type="email" label="Email" autoComplete="email" required />
        </div>

        {services && services.length > 0 && (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What do you need?
            </span>
            <select
              name="serviceSlug"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              defaultValue=""
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {status.kind === 'error' && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{status.message}</p>
        )}

        <button
          type="submit"
          disabled={status.kind === 'submitting'}
          className="inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--tp-ink)] transition hover:brightness-95 disabled:opacity-60"
          style={{ backgroundColor: 'var(--tp-accent)' }}
        >
          {status.kind === 'submitting' ? 'Sending…' : 'Get my free quote'}
        </button>
        <p className="text-center text-xs text-slate-500">
          No obligation. You&apos;ll hear from us within one business day.
        </p>
      </div>
    </form>
  )
}

function QField({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </label>
  )
}
