'use client'

import { useId, useState, type FormEvent } from 'react'
import { submitLead } from '@/lib/storefront-api'
import { formatEnquiryMoney, useEnquiryCart } from '@/lib/enquiryCart'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { CheckIcon, CloseIcon } from './icons'
import './trade-pro.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

/**
 * Slide-over enquiry cart: lines (name, est. cost, qty) + contact form → CRM lead.
 * Success is a single modal: “Enquiry sent — We will call you back within 2 hours”.
 */
export function TradeProEnquiryDrawer({ tenantId }: { tenantId: string }) {
  const {
    lines,
    itemCount,
    estimatedTotal,
    currency,
    isOpen,
    closeCart,
    setQuantity,
    removeLine,
    clear,
  } = useEnquiryCart()
  const { user } = useAccountAuth()
  const titleId = useId()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [successOpen, setSuccessOpen] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting' || lines.length === 0) return

    const form = new FormData(e.currentTarget)
    const firstName = String(form.get('name') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const address = String(form.get('address') ?? '').trim()
    const preferredDate = String(form.get('preferredDate') ?? '').trim()

    if (!firstName) {
      setStatus({ kind: 'error', message: 'Please share your name.' })
      return
    }
    if (!phone || phone.length < 7) {
      setStatus({ kind: 'error', message: 'Please share a valid phone number.' })
      return
    }
    if (!address) {
      setStatus({ kind: 'error', message: 'Please share your address.' })
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email, or leave it blank.' })
      return
    }

    setStatus({ kind: 'submitting' })
    try {
      await submitLead({
        tenantId,
        firstName,
        email: email || undefined,
        phone,
        address,
        preferredDate: preferredDate || undefined,
        source: 'storefront-enquiry-cart',
        services: lines.map((l) => ({
          serviceId: l.serviceId,
          serviceSlug: l.serviceSlug,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice > 0 ? l.unitPrice : undefined,
          currency: l.currency,
        })),
      })
      clear()
      closeCart()
      setStatus({ kind: 'idle' })
      setSuccessOpen(true)
      e.currentTarget.reset()
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <>
      <div
        className={`tp-enquiry-backdrop ${isOpen ? 'tp-enquiry-backdrop--open' : ''}`}
        aria-hidden={!isOpen}
        onClick={closeCart}
      />
      <aside
        className={`tp-enquiry-drawer ${isOpen ? 'tp-enquiry-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--tp-hairline)] px-4 py-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--tp-ink)]">
            Your enquiry {itemCount > 0 ? `(${itemCount})` : ''}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--tp-ink)] hover:bg-[var(--tp-canvas-soft)]"
            aria-label="Close cart"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {lines.length === 0 ? (
            <p className="text-sm text-[var(--tp-body)]">
              Add one or more services, then send your enquiry. We&apos;ll call you back.
            </p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li
                  key={line.lineId}
                  className="rounded-xl border border-[var(--tp-hairline)] bg-[var(--tp-canvas-soft)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--tp-ink)]">{line.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--tp-mute)]">
                        {line.unitPrice > 0
                          ? `Est. ${formatEnquiryMoney(line.unitPrice, line.currency)} each`
                          : 'Free estimate'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.lineId)}
                      className="shrink-0 text-xs font-medium text-[var(--tp-mute)] underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tp-hairline)] bg-white px-1 py-0.5">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    {line.unitPrice > 0 ? (
                      <span className="text-sm font-semibold text-[var(--tp-ink)]">
                        {formatEnquiryMoney(line.unitPrice * line.quantity, line.currency)}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && estimatedTotal > 0 ? (
            <div className="mt-4 flex items-center justify-between border-t border-[var(--tp-hairline)] pt-3 text-sm">
              <span className="text-[var(--tp-mute)]">Estimated total</span>
              <span className="font-semibold text-[var(--tp-ink)]">
                {formatEnquiryMoney(estimatedTotal, currency)}
              </span>
            </div>
          ) : null}

          {lines.length > 0 ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate>
              <p className="text-sm font-semibold text-[var(--tp-ink)]">Send enquiry</p>
              <Field
                name="name"
                label="Name *"
                autoComplete="name"
                required
                defaultValue={user ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : undefined}
              />
              <Field
                name="phone"
                type="tel"
                label="Phone *"
                autoComplete="tel"
                required
                defaultValue={user?.phone}
              />
              <Field name="address" label="Address *" autoComplete="street-address" required />
              <Field
                name="email"
                type="email"
                label="Email (optional)"
                autoComplete="email"
                defaultValue={user?.email}
              />
              <Field name="preferredDate" type="date" label="Preferred date" />

              {status.kind === 'error' ? (
                <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-[var(--tp-error)]">
                  {status.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status.kind === 'submitting'}
                className="tp-btn-primary w-full"
              >
                {status.kind === 'submitting' ? 'Sending…' : 'Send enquiry'}
              </button>
            </form>
          ) : (
            <button type="button" onClick={closeCart} className="tp-btn-primary mt-6 w-full">
              Browse services
            </button>
          )}
        </div>
      </aside>

      {successOpen ? (
        <div className="tp-enquiry-success" role="dialog" aria-modal="true" aria-labelledby="tp-enquiry-success-title">
          <div className="tp-enquiry-success__card">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'var(--tp-accent)',
                color: 'var(--tp-accent-contrast)',
              }}
            >
              <CheckIcon className="h-6 w-6" />
            </div>
            <h3 id="tp-enquiry-success-title" className="mt-4 text-lg font-bold text-[var(--tp-ink)]">
              Enquiry sent
            </h3>
            <p className="mt-2 text-sm text-[var(--tp-body)]">
              We will call you back within 2 hours
            </p>
            <button
              type="button"
              className="tp-btn-primary mt-6 w-full"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  defaultValue,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  defaultValue?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--tp-mute)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="mt-1.5 block w-full rounded-xl border border-[var(--tp-hairline)] bg-white px-3 py-2.5 text-sm text-[var(--tp-ink)] focus:border-[var(--tp-cta)] focus:outline-none focus:ring-2 focus:ring-[var(--tp-cta)]/20"
      />
    </label>
  )
}
