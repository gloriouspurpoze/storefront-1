'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  deleteCustomerAddress,
  fetchCustomerAddresses,
  setDefaultCustomerAddress,
  upsertCustomerAddress,
  type CustomerAddressInput,
  type CustomerSavedAddress,
} from '@/lib/storefront-api'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

const TYPE_LABELS: Record<NonNullable<CustomerAddressInput['type']>, string> = {
  home: 'Home',
  work: 'Work',
  other: 'Other',
}

const EMPTY_FORM: CustomerAddressInput = {
  type: 'home',
  label: '',
  street: '',
  apartment: '',
  landmark: '',
  city: '',
  state: '',
  zipCode: '',
  isDefault: false,
}

function toForm(a: CustomerSavedAddress): CustomerAddressInput {
  return {
    type: a.type ?? 'home',
    label: a.label ?? '',
    street: a.street,
    apartment: a.apartment ?? '',
    landmark: a.landmark ?? '',
    city: a.city,
    state: a.state,
    zipCode: a.zipCode,
    isDefault: Boolean(a.isDefault),
  }
}

function validate(form: CustomerAddressInput): string | null {
  if (!form.street.trim()) return 'Enter the street address.'
  if (!form.city.trim()) return 'Enter the city.'
  if (!form.state.trim()) return 'Enter the state.'
  if (!/^\d{6}$/.test(form.zipCode.trim())) return 'PIN code must be 6 digits.'
  return null
}

export function AddressBook() {
  const { tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const accessToken = tokens?.accessToken
  const [addresses, setAddresses] = useState<CustomerSavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** null = closed, 'new' = adding, otherwise the address id being edited. */
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerAddressInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!accessToken) return
    setError(null)
    try {
      const list = await fetchCustomerAddresses({ accessToken })
      // Default first, like most marketplaces.
      setAddresses([...list].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault))))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load addresses')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated || !accessToken) {
      setLoading(false)
      return
    }
    void load()
  }, [isReady, isAuthenticated, accessToken, load])

  const openNew = () => {
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 })
    setFormError(null)
    setEditing('new')
  }

  const openEdit = (a: CustomerSavedAddress) => {
    setForm(toForm(a))
    setFormError(null)
    setEditing(a._id)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    const problem = validate(form)
    if (problem) {
      setFormError(problem)
      return
    }
    setBusyId('form')
    setFormError(null)
    try {
      await upsertCustomerAddress({
        accessToken,
        addressId: editing === 'new' ? null : editing,
        // Only send isDefault when turning it on — the API clears other defaults itself.
        address: { ...form, isDefault: form.isDefault ? true : undefined },
      })
      setEditing(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save address')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (a: CustomerSavedAddress) => {
    if (!accessToken) return
    if (!window.confirm('Delete this address?')) return
    setBusyId(a._id)
    try {
      await deleteCustomerAddress({ accessToken, addressId: a._id })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete address')
    } finally {
      setBusyId(null)
    }
  }

  const makeDefault = async (a: CustomerSavedAddress) => {
    if (!accessToken) return
    setBusyId(a._id)
    try {
      await setDefaultCustomerAddress({ accessToken, addressId: a._id })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update default address')
    } finally {
      setBusyId(null)
    }
  }

  const field = (key: keyof CustomerAddressInput) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  })

  return (
    <RequireStorefrontAuth returnPath="/account/addresses">
      <AccountPageHeader
        title="Saved addresses"
        subtitle="Used to fill in delivery details at checkout. Your default address is used first."
      />

      {loading ? (
        <p className={t.statusLoading}>Loading addresses…</p>
      ) : (
        <div className="space-y-4">
          {error ? (
            <p role="alert" className={t.error}>
              {error}
            </p>
          ) : null}

          {editing ? (
            <form className={`${t.card} ${t.form}`} onSubmit={submit} noValidate>
              <h2 className="text-base font-semibold">{editing === 'new' ? 'Add address' : 'Edit address'}</h2>

              <fieldset>
                <legend className={t.label}>Save as</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={form.type === type}
                      onClick={() => setForm({ ...form, type })}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        form.type === type
                          ? 'border-[var(--site-brand,#171717)] bg-[var(--site-brand,#171717)] text-white'
                          : 'border-neutral-300'
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </fieldset>

              {form.type === 'other' ? (
                <div>
                  <label htmlFor="addr-label" className={t.label}>
                    Label
                  </label>
                  <input id="addr-label" className={t.input} placeholder="e.g. Mom’s place" {...field('label')} />
                </div>
              ) : null}

              <div>
                <label htmlFor="addr-street" className={t.label}>
                  Street address
                </label>
                <input id="addr-street" className={t.input} autoComplete="address-line1" {...field('street')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="addr-apartment" className={t.label}>
                    Flat / floor <span className={t.textMuted}>(optional)</span>
                  </label>
                  <input id="addr-apartment" className={t.input} autoComplete="address-line2" {...field('apartment')} />
                </div>
                <div>
                  <label htmlFor="addr-landmark" className={t.label}>
                    Landmark <span className={t.textMuted}>(optional)</span>
                  </label>
                  <input id="addr-landmark" className={t.input} {...field('landmark')} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="addr-city" className={t.label}>
                    City
                  </label>
                  <input id="addr-city" className={t.input} autoComplete="address-level2" {...field('city')} />
                </div>
                <div>
                  <label htmlFor="addr-state" className={t.label}>
                    State
                  </label>
                  <input id="addr-state" className={t.input} autoComplete="address-level1" {...field('state')} />
                </div>
                <div>
                  <label htmlFor="addr-zip" className={t.label}>
                    PIN code
                  </label>
                  <input
                    id="addr-zip"
                    className={t.input}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    {...field('zipCode')}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.isDefault)}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Make this my default address
              </label>

              {formError ? (
                <p role="alert" className={t.error}>
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button type="submit" className={t.btnPrimary} disabled={busyId === 'form'}>
                  {busyId === 'form' ? 'Saving…' : 'Save address'}
                </button>
                <button type="button" className={t.btnSecondary} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className={t.btnPrimary} onClick={openNew}>
              + Add new address
            </button>
          )}

          {addresses.length === 0 && !editing ? (
            <div className={t.emptyState}>
              <p className={t.emptyTitle}>No saved addresses</p>
              <p className={`${t.textMuted} mt-1`}>Add one to check out faster next time.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {addresses.map((a) => (
                <li key={a._id} className={`${t.card} flex flex-col`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {a.type === 'other' && a.label ? a.label : TYPE_LABELS[a.type ?? 'home']}
                    </span>
                    {a.isDefault ? (
                      <span className={`${t.statusBadge} ${t.statusBadgeDelivered}`}>Default</span>
                    ) : null}
                  </div>
                  <address className={`${t.text} flex-1 not-italic`}>
                    <span className="block">{[a.street, a.apartment].filter(Boolean).join(', ')}</span>
                    {a.landmark ? <span className="block">Near {a.landmark}</span> : null}
                    <span className="block">
                      {a.city}, {a.state} {a.zipCode}
                    </span>
                  </address>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <button type="button" className={t.link} onClick={() => openEdit(a)}>
                      Edit
                    </button>
                    {!a.isDefault ? (
                      <button
                        type="button"
                        className={t.link}
                        disabled={busyId === a._id}
                        onClick={() => void makeDefault(a)}
                      >
                        Set as default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={t.link}
                      disabled={busyId === a._id}
                      onClick={() => void remove(a)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </RequireStorefrontAuth>
  )
}
