'use client'

import { useState, type FormEvent } from 'react'
import { submitSellerApplication, type SellerApplicationInput } from '@/lib/marketplace-api'
import { ButtonLink, Field, IconCheck, Input, Textarea } from '@/ui'
import './marketplace.css'

const EMPTY: SellerApplicationInput = {
  displayName: '',
  contactName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  website: '',
  instagram: '',
  about: '',
  company_site: '',
}

/** `/sell/apply` — creates a pending seller the operator reviews in admin. */
export function SellerApplyForm({ tenantId, siteName }: { tenantId: string; siteName: string }) {
  const [form, setForm] = useState<SellerApplicationInput>(EMPTY)
  const [categories, setCategories] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const set = (key: keyof SellerApplicationInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    if (form.displayName.trim().length < 2) return setError('Please enter your shop name.')
    if (form.contactName.trim().length < 2) return setError('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please enter a valid email.')
    if (!/^\+?[0-9\s()-]{7,20}$/.test(form.phone.trim())) return setError('Please enter a valid phone number.')

    setBusy(true)
    try {
      await submitSellerApplication(tenantId, {
        ...form,
        categories: categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 10),
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mk-success">
        <span className="mk-status" data-tone="good">
          <IconCheck size={16} /> Application received
        </span>
        <h2>Thanks — we&apos;ll be in touch</h2>
        <p>
          The {siteName} team reviews every application. We&apos;ll email {form.email} once your shop is approved, with
          a link to set up your seller portal.
        </p>
        <div className="mk-success__actions">
          <ButtonLink href="/products">Browse the marketplace</ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <form className="mk-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <section className="mk-form__section">
        <h2>Your shop</h2>
        <Field label="Shop name" htmlFor="ap-shop">
          <Input id="ap-shop" required maxLength={120} value={form.displayName} onChange={set('displayName')} />
        </Field>
        <Field label="What do you sell?" htmlFor="ap-cats" hint="Comma separated, e.g. ceramics, home decor, gifts">
          <Input id="ap-cats" value={categories} onChange={(e) => setCategories(e.target.value)} />
        </Field>
        <Field label="Tell us about your work" htmlFor="ap-about">
          <Textarea id="ap-about" rows={4} maxLength={2000} value={form.about} onChange={set('about')} />
        </Field>
        <div className="mk-form__row">
          <Field label="Website" htmlFor="ap-web">
            <Input id="ap-web" inputMode="url" placeholder="yourshop.com" value={form.website} onChange={set('website')} />
          </Field>
          <Field label="Instagram" htmlFor="ap-ig">
            <Input id="ap-ig" placeholder="instagram.com/yourshop" value={form.instagram} onChange={set('instagram')} />
          </Field>
        </div>
      </section>

      <section className="mk-form__section">
        <h2>Contact</h2>
        <div className="mk-form__row">
          <Field label="Your name" htmlFor="ap-name">
            <Input id="ap-name" required autoComplete="name" value={form.contactName} onChange={set('contactName')} />
          </Field>
          <Field label="Phone" htmlFor="ap-phone">
            <Input id="ap-phone" required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label="Email" htmlFor="ap-email">
          <Input id="ap-email" required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
        <div className="mk-form__row">
          <Field label="City" htmlFor="ap-city">
            <Input id="ap-city" autoComplete="address-level2" value={form.city} onChange={set('city')} />
          </Field>
          <Field label="State" htmlFor="ap-state">
            <Input id="ap-state" autoComplete="address-level1" value={form.state} onChange={set('state')} />
          </Field>
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <input
          type="text"
          name="company_site"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="sf-visually-hidden"
          value={form.company_site}
          onChange={set('company_site')}
        />
      </section>

      {error ? (
        <p className="mk-alert" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="sf-btn sf-btn--lg sf-btn--block" disabled={busy} aria-busy={busy}>
        {busy ? 'Submitting…' : 'Submit application'}
      </button>
      <p className="mk-summary__note">We only use these details to review your application and contact you about it.</p>
    </form>
  )
}
