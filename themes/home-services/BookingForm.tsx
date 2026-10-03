'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { submitLead, type PublicService } from '../../lib/storefront-api'
import {
  BOOKING_MAX_DAYS_AHEAD,
  BOOKING_TIME_SLOTS,
  BookingUnavailableError,
  localIsoDate,
  submitBooking,
  type BookingTimeSlotKey,
} from '@/lib/storefrontBooking'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { useCartAuthGate } from '@/lib/useCartAuthGate'

interface BookingFormProps {
  tenantId: string
  /** Pre-selected service (passed when arriving from /services/[slug]). */
  initialServiceSlug?: string
  services?: PublicService[]
  source?: string
  /**
   * `enquiry` (default) — callback request → `POST /public/storefront/leads` (always available).
   * `booking` — Service booking add-on: adds preferred date + time slot and posts to the gated
   * `POST /public/storefront/bookings`. Only pass `booking` when
   * `isAddonActive(config, STOREFRONT_ADDON_FLAGS.booking)`.
   */
  mode?: 'enquiry' | 'booking'
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deduped: boolean; reference?: string; window?: string; emailed?: boolean }
  | { kind: 'error'; message: string }
  | { kind: 'unavailable'; message: string }

/**
 * Single booking / lead capture form. Both modes create a CRM contact tagged
 * `storefront-lead` + an inquiry deal, so the tenant's admin Leads screen picks it up
 * immediately; bookings are additionally tagged `storefront-booking` and carry the
 * preferred visit window.
 *
 * Submitting requires a signed-in customer account.
 */
export function BookingForm({
  tenantId,
  initialServiceSlug,
  services,
  source = 'storefront-home',
  mode = 'enquiry',
}: BookingFormProps) {
  const isBooking = mode === 'booking'
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug ?? '')
  const [timeSlot, setTimeSlot] = useState<BookingTimeSlotKey | ''>('')
  // Local-calendar bounds are computed after mount so SSR (server timezone) never disagrees.
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string; initial: string } | null>(null)
  useEffect(() => {
    setDateBounds({ min: localIsoDate(0), max: localIsoDate(BOOKING_MAX_DAYS_AHEAD), initial: localIsoDate(1) })
  }, [])
  const { tokens } = useAccountAuth()
  const { isAuthenticated, isReady, requireAuthForCart } = useCartAuthGate()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return
    if (!requireAuthForCart()) return

    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const firstName = String(form.get('firstName') ?? '').trim()
    const lastName = String(form.get('lastName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const phone = String(form.get('phone') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const locality = String(form.get('locality') ?? '').trim()
    const preferredDate = String(form.get('preferredDate') ?? '').trim()
    const slug = serviceSlug.trim() || undefined
    const selected = services?.find((s) => s.slug === slug)

    if (!firstName) {
      setStatus({ kind: 'error', message: 'Please share your name so we can reach you.' })
      return
    }
    if (!phone || phone.length < 7) {
      setStatus({ kind: 'error', message: 'Please share a valid phone number.' })
      return
    }
    if (!locality) {
      setStatus({
        kind: 'error',
        message: isBooking
          ? 'Please share the address for the visit.'
          : 'Please share your neighborhood, address, or pincode.',
      })
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email, or leave it blank.' })
      return
    }
    if (isBooking) {
      if (services && services.length > 0 && !slug) {
        setStatus({ kind: 'error', message: 'Please choose the service you need.' })
        return
      }
      if (!preferredDate) {
        setStatus({ kind: 'error', message: 'Please pick a preferred date.' })
        return
      }
      if (!timeSlot) {
        setStatus({ kind: 'error', message: 'Please pick a preferred time slot.' })
        return
      }
    }

    const serviceLines = [
      {
        serviceId: selected?.id,
        serviceSlug: slug || selected?.slug || 'general',
        name: selected?.name || slug || (isBooking ? 'Service visit' : 'General enquiry'),
        quantity: 1,
        unitPrice: selected?.basePrice,
        currency: selected?.currency,
      },
    ]

    setStatus({ kind: 'submitting' })
    try {
      if (isBooking && timeSlot) {
        const result = await submitBooking({
          tenantId,
          accessToken: tokens?.accessToken,
          firstName,
          lastName: lastName || undefined,
          email: email || undefined,
          phone,
          address: locality,
          locality,
          preferredDate,
          timeSlot,
          message: message || undefined,
          source,
          services: serviceLines,
        })
        setStatus({
          kind: 'success',
          deduped: false,
          reference: result.reference,
          window: result.preferredWindow,
          emailed: result.confirmationEmail,
        })
      } else {
        const result = await submitLead({
          tenantId,
          firstName,
          lastName,
          email: email || undefined,
          phone,
          address: locality,
          locality,
          message,
          serviceSlug: slug,
          source,
          accessToken: tokens?.accessToken,
          services: serviceLines,
        })
        setStatus({ kind: 'success', deduped: result.deduped })
      }
      formEl.reset()
      setServiceSlug(initialServiceSlug ?? '')
      setTimeSlot('')
    } catch (err) {
      if (err instanceof BookingUnavailableError) {
        setStatus({ kind: 'unavailable', message: err.message })
        return
      }
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  if (status.kind === 'unavailable') {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm text-slate-700">{status.message}</p>
        <a
          href="/contact"
          className="sf-btn"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          Contact us
        </a>
      </div>
    )
  }

  if (status.kind === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-emerald-900">
          {status.reference ? 'Booking request received' : status.deduped ? "We've got you" : 'Request received'}
        </h2>
        {status.reference ? (
          <div className="mt-3 space-y-1 text-sm text-emerald-800">
            <p>
              Reference <strong>{status.reference}</strong>
            </p>
            {status.window ? <p>Preferred time: {status.window}</p> : null}
            <p className="pt-2">
              Our team will call you to confirm the visit.
              {status.emailed ? ' A confirmation is on its way to your inbox.' : ''}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-emerald-800">
            {status.deduped
              ? 'We already have a recent request from you. Our team will be in touch shortly.'
              : 'Thanks for reaching out. Our team will call you back within one business day.'}
          </p>
        )}
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-6 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
        >
          {status.reference ? 'Book another service' : 'Submit another request'}
        </button>
      </div>
    )
  }

  if (isReady && !isAuthenticated) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          {isBooking ? 'Sign in to book a visit' : 'Sign in to send an enquiry'}
        </h2>
        <p className="text-sm text-slate-600">
          Create or sign in to your account so you can track the status of your request.
        </p>
        <button
          type="button"
          onClick={() => requireAuthForCart()}
          className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          Sign in to continue
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
        <Field
          name="email"
          type="email"
          label={isBooking ? 'Email (for your confirmation)' : 'Email'}
          autoComplete="email"
        />
        <Field name="phone" type="tel" label="Phone *" autoComplete="tel" required />
      </div>
      <Field
        name="locality"
        label={isBooking ? 'Visit address *' : 'Address / neighborhood / pincode *'}
        autoComplete="street-address"
        required
      />

      {services && services.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            {isBooking ? 'Service *' : 'What do you need?'}
          </span>
          <select
            name="serviceSlug"
            value={serviceSlug}
            required={isBooking}
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

      {isBooking ? (
        <>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Preferred date *</span>
            <input
              name="preferredDate"
              type="date"
              required
              key={dateBounds?.initial ?? 'pending'}
              min={dateBounds?.min}
              max={dateBounds?.max}
              defaultValue={dateBounds?.initial}
              className="sf-input mt-1.5"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Preferred time *</legend>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {BOOKING_TIME_SLOTS.map((slot) => {
                const active = timeSlot === slot.key
                return (
                  <label
                    key={slot.key}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-center text-sm transition ${
                      active
                        ? 'border-transparent text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                    style={active ? { backgroundColor: 'var(--site-brand)' } : undefined}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value={slot.key}
                      checked={active}
                      onChange={() => setTimeSlot(slot.key)}
                      className="sr-only"
                    />
                    {slot.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Anything we should know?
        </span>
        <textarea
          name="message"
          rows={4}
          className="sf-input mt-1.5"
          placeholder={
            isBooking
              ? 'Describe the issue, access instructions, or anything the pro should bring.'
              : 'Share preferred times, the issue, or special instructions.'
          }
        />
      </label>

      {status.kind === 'error' && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{status.message}</p>
      )}

      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        className="sf-btn sf-btn--block"
        style={{ backgroundColor: 'var(--site-brand)' }}
        aria-busy={status.kind === 'submitting'}
      >
        {status.kind === 'submitting' ? 'Sending…' : isBooking ? 'Request booking' : 'Request a callback'}
      </button>
      <p className="text-center text-xs text-slate-500">
        {isBooking
          ? "Your slot is a request — we'll call to confirm before the visit."
          : "We'll never share your details. You'll hear from us within one business day."}
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
        className="sf-input mt-1.5"
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
