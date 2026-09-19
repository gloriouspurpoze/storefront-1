'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { accountSkinPrefix, isTradeProAccountChrome } from '@/lib/account-themes'
import {
  emptyProfileForm,
  isProfileFormIncomplete,
  profileFormFromSources,
  validateProfileForm,
  type ProfileFieldErrors,
  type ProfileForm,
} from '@/lib/accountProfileForm'
import {
  fetchCustomerDefaultAddress,
  fetchCustomerProfile,
  saveCustomerAddress,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/lib/storefront-api'
import { toProfilePhoneE164 } from '@/lib/storefrontCustomerContact'
import { displayName } from '@/lib/storefront-auth'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountLayoutTheme, useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

export function AccountProfilePanel({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated, setSession, logout } = useAccountAuth()
  const themeKey = useAccountTheme()
  const layoutTheme = useAccountLayoutTheme()
  const skin = accountSkinPrefix(themeKey)
  const t = accountThemeClasses(themeKey)
  const isTradePro = isTradeProAccountChrome(layoutTheme)

  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !isAuthenticated || !tokens?.accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const sessionFallback = user
      ? { firstName: user.firstName, lastName: user.lastName, phone: user.phone }
      : undefined

    Promise.all([
      fetchCustomerProfile({ tenantId, accessToken: tokens.accessToken }),
      fetchCustomerDefaultAddress({ accessToken: tokens.accessToken }).catch(() => null),
    ])
      .then(([data, address]) => {
        if (cancelled) return
        setProfile(data)
        setAddressId(address?._id || null)
        setForm(profileFormFromSources(data, address, sessionFallback))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load profile')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Intentionally omit `user` — session updates after save must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per auth token / tenant
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 3200)
    return () => clearTimeout(timer)
  }, [success])

  const incomplete = useMemo(() => isProfileFormIncomplete(form), [form])
  const display =
    form.firstName || form.lastName
      ? `${form.firstName} ${form.lastName}`.trim()
      : user
        ? displayName(user)
        : '—'
  const initial = (form.firstName || user?.firstName || '?').charAt(0).toUpperCase()
  const shopLabel = isTradePro
    ? 'Back to services'
    : skin === 'mf' || skin === 'bb'
      ? 'Order from menu'
      : 'Continue shopping'
  const shopHref = isTradePro ? '/services' : '/'
  const ordersLabel = isTradePro ? 'View enquiries' : 'View orders'

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSuccess(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!tokens?.accessToken || saving) return

    const errors = validateProfileForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted fields.')
      return
    }

    const phoneE164 = toProfilePhoneE164(form.phone)
    if (!phoneE164) {
      setFieldErrors({ phone: 'Enter a valid 10-digit mobile number.' })
      setError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateCustomerProfile({
        accessToken: tokens.accessToken,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || '.',
        phone: phoneE164,
      })

      const savedAddress = await saveCustomerAddress({
        accessToken: tokens.accessToken,
        addressId,
        street: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
      })

      setAddressId(savedAddress._id || addressId)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName: updated.firstName,
              lastName: updated.lastName,
              phone: updated.phone,
            }
          : {
              id: updated.id,
              firstName: updated.firstName,
              lastName: updated.lastName,
              email: updated.email,
              phone: updated.phone,
              profilePicture: updated.profilePicture,
              userType: updated.userType,
            },
      )

      if (user) {
        setSession(
          {
            ...user,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone,
            profilePicture: updated.profilePicture ?? user.profilePicture,
          },
          tokens,
        )
      }

      setSuccess('Profile saved. Checkout will use these details.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = (key: keyof ProfileForm) =>
    `${t.input}${fieldErrors[key] ? (skin ? ` ${skin}-acct-input--error` : ' ring-1 ring-red-400') : ''}`

  return (
    <RequireStorefrontAuth returnPath="/account/profile">
      <AccountPageHeader
        title="Profile"
        subtitle="Update your contact and delivery details — they auto-fill at checkout."
      />

      {loading ? (
        <p className={t.statusLoading}>Loading profile…</p>
      ) : error && !profile && !form.firstName ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : (
        <div className={`${t.card}${skin ? ` ${skin}-acct-profile` : ' space-y-6'}`}>
          <div className={skin ? `${skin}-acct-profile-head` : 'flex items-center gap-4'}>
            {profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePicture}
                alt=""
                className={
                  skin ? `${skin}-acct-avatar` : 'h-16 w-16 rounded-full object-cover ring-2 ring-neutral-100'
                }
              />
            ) : (
              <div
                className={
                  skin
                    ? `${skin}-acct-avatar ${skin}-acct-avatar--fallback`
                    : 'flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white'
                }
                style={skin ? undefined : { backgroundColor: 'var(--site-brand, #171717)' }}
              >
                {initial}
              </div>
            )}
            <div>
              <p className={skin ? `${skin}-acct-order-num` : 'text-lg font-semibold text-neutral-900'}>
                {display}
              </p>
              <p className={t.textMuted}>Customer account</p>
            </div>
          </div>

          {incomplete ? (
            <p
              className={
                skin
                  ? `${skin}-acct-profile-hint`
                  : 'rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'
              }
              role="status"
            >
              Complete your profile so checkout can auto-fill name, phone, and delivery address.
            </p>
          ) : null}

          <form onSubmit={onSubmit} className={t.form} noValidate>
            <div>
              <label htmlFor="profile-email" className={t.label}>
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                className={t.input}
                value={profile?.email ?? user?.email ?? ''}
                disabled
                readOnly
                autoComplete="email"
              />
              <p className={`${t.textMuted} mt-1 text-xs`}>
                Email comes from your sign-in and cannot be changed here.
              </p>
            </div>

            <div className={skin ? `${skin}-acct-form-row` : 'grid gap-4 sm:grid-cols-2'}>
              <div>
                <label htmlFor="profile-first-name" className={t.label}>
                  First name
                </label>
                <input
                  id="profile-first-name"
                  type="text"
                  className={fieldClass('firstName')}
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  autoComplete="given-name"
                  required
                  maxLength={50}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                />
                {fieldErrors.firstName ? (
                  <p className={t.error} role="alert">
                    {fieldErrors.firstName}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="profile-last-name" className={t.label}>
                  Last name
                </label>
                <input
                  id="profile-last-name"
                  type="text"
                  className={fieldClass('lastName')}
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  autoComplete="family-name"
                  maxLength={50}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                />
                {fieldErrors.lastName ? (
                  <p className={t.error} role="alert">
                    {fieldErrors.lastName}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="profile-phone" className={t.label}>
                Phone
              </label>
              <div className={t.phoneRow}>
                <span className={t.phonePrefix}>+91</span>
                <input
                  id="profile-phone"
                  type="tel"
                  className={fieldClass('phone')}
                  value={form.phone}
                  onChange={(e) =>
                    setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
              </div>
              {fieldErrors.phone ? (
                <p className={t.error} role="alert">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="profile-street" className={t.label}>
                Street address
              </label>
              <input
                id="profile-street"
                type="text"
                className={fieldClass('street')}
                value={form.street}
                onChange={(e) => setField('street', e.target.value)}
                autoComplete="address-line1"
                placeholder="House / street"
                required
                aria-invalid={Boolean(fieldErrors.street)}
              />
              {fieldErrors.street ? (
                <p className={t.error} role="alert">
                  {fieldErrors.street}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="profile-apartment" className={t.label}>
                Apartment / landmark <span className={t.textMuted}>(optional)</span>
              </label>
              <input
                id="profile-apartment"
                type="text"
                className={t.input}
                value={form.apartment}
                onChange={(e) => setField('apartment', e.target.value)}
                autoComplete="address-line2"
                placeholder="Flat, building, landmark"
              />
            </div>

            <div className={skin ? `${skin}-acct-form-row` : 'grid gap-4 sm:grid-cols-3'}>
              <div>
                <label htmlFor="profile-city" className={t.label}>
                  City
                </label>
                <input
                  id="profile-city"
                  type="text"
                  className={fieldClass('city')}
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  autoComplete="address-level2"
                  required
                  aria-invalid={Boolean(fieldErrors.city)}
                />
                {fieldErrors.city ? (
                  <p className={t.error} role="alert">
                    {fieldErrors.city}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="profile-state" className={t.label}>
                  State
                </label>
                <input
                  id="profile-state"
                  type="text"
                  className={fieldClass('state')}
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  autoComplete="address-level1"
                  required
                  aria-invalid={Boolean(fieldErrors.state)}
                />
                {fieldErrors.state ? (
                  <p className={t.error} role="alert">
                    {fieldErrors.state}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="profile-zip" className={t.label}>
                  PIN code
                </label>
                <input
                  id="profile-zip"
                  type="text"
                  className={fieldClass('zipCode')}
                  value={form.zipCode}
                  onChange={(e) =>
                    setField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  aria-invalid={Boolean(fieldErrors.zipCode)}
                />
                {fieldErrors.zipCode ? (
                  <p className={t.error} role="alert">
                    {fieldErrors.zipCode}
                  </p>
                ) : null}
              </div>
            </div>

            {error ? (
              <p role="alert" className={t.error}>
                {error}
              </p>
            ) : null}
            {success ? (
              <p
                role="status"
                className={
                  skin
                    ? `${skin}-acct-success`
                    : 'mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
                }
              >
                {success}
              </p>
            ) : null}

            <div
              className={
                skin
                  ? `${skin}-acct-actions ${skin}-acct-actions--inline`
                  : 'flex flex-wrap gap-3 border-t border-neutral-100 pt-4'
              }
            >
              <button type="submit" className={t.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              <Link href="/account/orders" className={t.btnSecondary}>
                {ordersLabel}
              </Link>
              <Link href={shopHref} className={t.btnSecondary}>
                {shopLabel}
              </Link>
              {isTradePro ? (
                <button type="button" onClick={() => void logout()} className={t.btnSecondary}>
                  Sign out
                </button>
              ) : null}
            </div>
          </form>
        </div>
      )}
    </RequireStorefrontAuth>
  )
}
