'use client'

import { useState, type FormEvent } from 'react'
import { submitLead, type PublicService } from '../../lib/storefront-api'

interface BookingFormProps {
  tenantId: string
  /** Pre-selected service (passed when arriving from /services/[slug]). */
  initialServiceSlug?: string
  services?: PublicService[]
  source?: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deduped: boolean }
  | { kind: 'error'; message: string }

/**
 * Single booking / lead capture form. Posts to `/api/public/storefront/leads`
 * via the storefront API client. The backend creates a CRM contact tagged
 * `storefront-lead` so the tenant's sales pipeline picks it up immediately.
 *
 * Designed to feel like "request a callback" rather than "schedule with us" —
 * scheduling logic moves in once the backend exposes per-service availability
 * (Phase 1.1).
 */
export function BookingForm({
  tenantId,
  initialServiceSlug,
  services,
  source = 'storefront-home',
}: BookingFormProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug ?? '')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return

    const form = new FormData(e.currentTarget)
    const firstName = String(form.get('firstName') ?? '').trim()
    const lastName = String(form.get('lastName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const phone = String(form.get('phone') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const locality = String(form.get('locality') ?? '').trim()
    const slug = serviceSlug.trim() || undefined

    if (!firstName) {
      setStatus({ kind: 'error', message: 'Please share your name so we can reach you.' })
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
        firstName,
        lastName,
        email,
        phone,
        message,
        locality,
        serviceSlug: slug,
        source,
      })
      setStatus({ kind: 'success', deduped: result.deduped })
      e.currentTarget.reset()
      setServiceSlug(initialServiceSlug ?? '')
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  if (status.kind === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-emerald-900">
          {status.deduped ? "We've got you" : 'Request received'}
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          {status.deduped
            ? 'We already have a recent request from you. Our team will be in touch shortly.'
            : 'Thanks for reaching out. Our team will call you back within one business day.'}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-6 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="firstName" label="First name *" autoComplete="given-name" required />
        <Field name="lastName" label="Last name" autoComplete="family-name" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="email" type="email" label="Email *" autoComplete="email" required />
        <Field name="phone" type="tel" label="Phone" autoComplete="tel" />
      </div>
      <Field name="locality" label="Neighborhood or pincode" autoComplete="postal-code" />

      {services && services.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">What do you need?</span>
          <select
            name="serviceSlug"
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Anything we should know?
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Share preferred times, the issue, or special instructions."
        />
      </label>

      {status.kind === 'error' && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{status.message}</p>
      )}

      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        style={{ backgroundColor: 'var(--site-brand)' }}
      >
        {status.kind === 'submitting' ? 'Sending…' : 'Request a callback'}
      </button>
      <p className="text-center text-xs text-slate-500">
        We&apos;ll never share your details. You&apos;ll hear from us within one business day.
      </p>
    </form>
  )
}

function Field({
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </label>
  )
}

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="5 10 9 14 15 6" />
    </svg>
  )
}
