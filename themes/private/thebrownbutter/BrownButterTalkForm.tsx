'use client'

import { useState, type FormEvent } from 'react'
import { submitLead } from '@/lib/storefront-api'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function BrownButterTalkForm({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status.kind === 'submitting') return

    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const firstName = String(form.get('firstName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const phone = String(form.get('phone') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()

    if (!firstName) {
      setStatus({ kind: 'error', message: 'Please tell us your name.' })
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      setStatus({ kind: 'error', message: 'Please share a phone number we can reach.' })
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ kind: 'error', message: 'That email does not look right. You can leave it blank.' })
      return
    }
    if (message.length < 4) {
      setStatus({ kind: 'error', message: 'Add a short note so we know how to help.' })
      return
    }

    setStatus({ kind: 'submitting' })
    try {
      await submitLead({
        tenantId,
        firstName,
        email: email || undefined,
        phone,
        address: 'Store enquiry',
        message,
        source: 'brownbutter-talk',
        services: [{ name: 'Talk to us', quantity: 1 }],
      })
      formEl.reset()
      setStatus({ kind: 'success' })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  if (status.kind === 'success') {
    return (
      <p className="bb-talk-success" role="status">
        Got it. We will call or write back shortly.
      </p>
    )
  }

  return (
    <form className="bb-talk-form" onSubmit={(event) => void onSubmit(event)}>
      <div className="field">
        <label htmlFor="bb-talk-name">Name</label>
        <input id="bb-talk-name" name="firstName" autoComplete="name" placeholder="Your name" />
      </div>
      <div className="field">
        <label htmlFor="bb-talk-phone">Phone</label>
        <input id="bb-talk-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" />
      </div>
      <div className="field">
        <label htmlFor="bb-talk-email">Email <span className="bb-optional">optional</span></label>
        <input id="bb-talk-email" name="email" type="email" autoComplete="email" placeholder="you@email.com" />
      </div>
      <div className="field">
        <label htmlFor="bb-talk-message">Message</label>
        <textarea id="bb-talk-message" name="message" rows={4} placeholder="Custom tin, delivery question, or a hello" />
      </div>
      {status.kind === 'error' ? (
        <p className="no-item-warn show" role="alert">{status.message}</p>
      ) : null}
      <button type="submit" className="btn" disabled={status.kind === 'submitting'}>
        <span>{status.kind === 'submitting' ? 'Sending…' : 'Send message'}</span>
        {/* <span aria-hidden>→</span> */}
      </button>
    </form>
  )
}
