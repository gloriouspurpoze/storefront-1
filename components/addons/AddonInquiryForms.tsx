'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import {
  submitAmcEnquiry,
  submitB2bInquiry,
  type StorefrontAmcPackage,
} from '@/lib/storefrontAddonsApi'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

const inputCls =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'

function Field({
  label,
  name,
  required,
  children,
  hint,
}: {
  label: string
  name: string
  required?: boolean
  children?: ReactNode
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium text-slate-800" htmlFor={name}>
      {label}
      {required ? <span className="text-red-600"> *</span> : <span className="font-normal text-slate-500"> (optional)</span>}
      {children ?? <input id={name} name={name} required={required} className={inputCls} />}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  )
}

function useSubmit() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Optional: links the CRM lead to the signed-in customer (AccountAuthProvider wraps every tenant page).
  const accessToken = useAccountAuth().tokens?.accessToken
  return { status, setStatus, accessToken }
}

function StatusLine({ status, successText }: { status: Status; successText: string }) {
  if (status.kind === 'error')
    return (
      <p role="alert" className="text-sm text-red-700">
        {status.message}
      </p>
    )
  if (status.kind === 'success')
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {successText}
      </p>
    )
  return null
}

const submitBtnStyle = { backgroundColor: 'var(--site-brand, #4f46e5)' } as const

export function B2bInquiryForm({ tenantId }: { tenantId: string }) {
  const { status, setStatus, accessToken } = useSubmit()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const input = {
      companyName: get('companyName'),
      gstin: get('gstin').toUpperCase() || undefined,
      contactName: get('contactName'),
      email: get('email').toLowerCase() || undefined,
      phone: get('phone'),
      city: get('city') || undefined,
      quantity: get('quantity') || undefined,
      requirements: get('requirements'),
    }
    if (input.companyName.length < 2) return setStatus({ kind: 'error', message: 'Please enter your company name.' })
    if (!input.contactName) return setStatus({ kind: 'error', message: 'Please enter a contact name.' })
    if (input.phone.replace(/\D/g, '').length < 7)
      return setStatus({ kind: 'error', message: 'Please enter a valid phone number.' })
    if (input.gstin && !/^[0-9A-Z]{15}$/.test(input.gstin))
      return setStatus({ kind: 'error', message: 'GSTIN should be 15 letters/digits, or leave it blank.' })
    if (input.requirements.length < 3)
      return setStatus({ kind: 'error', message: 'Tell us briefly what you need.' })

    setStatus({ kind: 'submitting' })
    try {
      await submitB2bInquiry(tenantId, input, accessToken)
      setStatus({ kind: 'success' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not send your inquiry.' })
    }
  }

  if (status.kind === 'success') {
    return <StatusLine status={status} successText="Thanks! Our team will get back to you with a quote shortly." />
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" name="companyName" required />
        <Field label="GSTIN" name="gstin" hint="Add it for GST invoices." />
        <Field label="Contact person" name="contactName" required />
        <Field label="Phone" name="phone" required>
          <input id="phone" name="phone" type="tel" required className={inputCls} autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="Email" name="email">
          <input id="email" name="email" type="email" className={inputCls} autoComplete="email" inputMode="email" />
        </Field>
        <Field label="City" name="city" />
      </div>
      <Field label="Quantity / volume" name="quantity" hint="e.g. 200 units per month" />
      <Field label="Requirements" name="requirements" required>
        <textarea id="requirements" name="requirements" rows={4} required className={inputCls} />
      </Field>
      <StatusLine status={status} successText="" />
      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        className="sf-btn"
        style={submitBtnStyle}
        aria-busy={status.kind === 'submitting'}
      >
        {status.kind === 'submitting' ? 'Sending…' : 'Request a quote'}
      </button>
    </form>
  )
}

export function AmcEnquiryForm({
  tenantId,
  packages,
  initialSlug,
}: {
  tenantId: string
  packages: StorefrontAmcPackage[]
  initialSlug?: string
}) {
  const { status, setStatus, accessToken } = useSubmit()
  const initial = packages.find((p) => p.slug === initialSlug) ?? packages[0]
  const [packageId, setPackageId] = useState(initial?.id ?? '')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status.kind === 'submitting') return
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const input = {
      packageId,
      name: get('name'),
      email: get('email').toLowerCase() || undefined,
      phone: get('phone'),
      address: get('address'),
      message: get('message') || undefined,
    }
    if (!input.packageId) return setStatus({ kind: 'error', message: 'Please choose a plan.' })
    if (!input.name) return setStatus({ kind: 'error', message: 'Please share your name.' })
    if (input.phone.replace(/\D/g, '').length < 7)
      return setStatus({ kind: 'error', message: 'Please enter a valid phone number.' })
    if (input.address.length < 3) return setStatus({ kind: 'error', message: 'Please share your address or pincode.' })

    setStatus({ kind: 'submitting' })
    try {
      await submitAmcEnquiry(tenantId, input, accessToken)
      setStatus({ kind: 'success' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not send your request.' })
    }
  }

  if (status.kind === 'success') {
    return <StatusLine status={status} successText="Thanks! We'll call you to confirm your plan and first visit." />
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Plan" name="packageId" required>
        <select
          id="packageId"
          name="packageId"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className={inputCls}
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required />
        <Field label="Phone" name="phone" required>
          <input id="phone" name="phone" type="tel" required className={inputCls} autoComplete="tel" inputMode="tel" />
        </Field>
      </div>
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" className={inputCls} autoComplete="email" inputMode="email" />
      </Field>
      <Field label="Address / pincode" name="address" required />
      <Field label="Anything we should know?" name="message">
        <textarea id="message" name="message" rows={3} className={inputCls} />
      </Field>
      <StatusLine status={status} successText="" />
      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        className="sf-btn"
        style={submitBtnStyle}
        aria-busy={status.kind === 'submitting'}
      >
        {status.kind === 'submitting' ? 'Sending…' : 'Request this plan'}
      </button>
    </form>
  )
}
