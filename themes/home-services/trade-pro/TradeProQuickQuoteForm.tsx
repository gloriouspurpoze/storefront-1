'use client'

import { useId, useState, type FormEvent } from 'react'
import { submitLead } from '@/lib/storefront-api'
import type { PublicService } from '../types'
import { CheckIcon } from './icons'
import './trade-pro.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deduped: boolean }
  | { kind: 'error'; message: string }

export function TradeProQuickQuoteForm({
  tenantId,
  services,
  source = 'storefront-home-hero',
  ctaLabel = 'Get a free quote',
}: {
  tenantId: string
  services?: PublicService[]
  source?: string
  ctaLabel?: string
}) {
  const errorId = useId()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const submitLabel = ctaLabel.trim() || 'Get a free quote'

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
      <div className="tp-card text-center" role="status">
        <div
          className="tp-mx-auto flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--tp-accent)',
            color: 'var(--tp-accent-contrast)',
          }}
        >
          <CheckIcon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[var(--tp-ink)]">
          {status.deduped ? "We've got you" : 'Request received'}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--tp-body)]">
          We&apos;ll call you back within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-4 text-sm font-semibold text-[var(--tp-mute)] underline-offset-4 hover:underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  const hasError = status.kind === 'error'

  return (
    <form onSubmit={onSubmit} className="tp-card" noValidate>
      <p className="text-base font-semibold text-[var(--tp-ink)]">{submitLabel}</p>
      <p className="mt-2 text-sm text-[var(--tp-body)]">
        Tell us what you need — we&apos;ll call you back today.
      </p>

      <div className="mt-6 space-y-4">
        <QField name="name" label="Name" autoComplete="name" required invalid={hasError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QField name="phone" type="tel" label="Phone" autoComplete="tel" required invalid={hasError} />
          <QField name="email" type="email" label="Email" autoComplete="email" required invalid={hasError} />
        </div>

        {services && services.length > 0 ? (
          <label className="block">
            <span className="text-xs font-semibold text-[var(--tp-mute)]">What do you need?</span>
            <select
              name="serviceSlug"
              className="mt-1.5 block w-full rounded-xl border border-[var(--tp-hairline)] bg-[var(--tp-canvas-soft)] px-3 py-2.5 text-sm text-[var(--tp-ink)] focus:border-[var(--tp-cta)] focus:outline-none focus:ring-2 focus:ring-[var(--tp-cta)]/20"
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
        ) : null}

        {hasError ? (
          <p id={errorId} role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-[var(--tp-error)]">
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status.kind === 'submitting'}
          className="tp-btn-primary w-full"
          aria-describedby={hasError ? errorId : undefined}
        >
          {status.kind === 'submitting' ? 'Sending…' : submitLabel}
        </button>
        <p className="text-center text-xs text-[var(--tp-mute)]">
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
  invalid,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  invalid?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--tp-mute)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className="mt-1.5 block w-full rounded-xl border border-[var(--tp-hairline)] bg-[var(--tp-canvas-soft)] px-3 py-2.5 text-sm text-[var(--tp-ink)] placeholder:text-[var(--tp-mute)] focus:border-[var(--tp-cta)] focus:outline-none focus:ring-2 focus:ring-[var(--tp-cta)]/20"
      />
    </label>
  )
}
