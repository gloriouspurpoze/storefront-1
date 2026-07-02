'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCustomerProfile, type CustomerProfile } from '@/lib/storefront-api'
import { displayName } from '@/lib/storefront-auth'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'
import { AccountPageHeader } from './AccountPageHeader'
import { RequireStorefrontAuth } from './RequireStorefrontAuth'

export function AccountProfilePanel({ tenantId }: { tenantId: string }) {
  const { user, tokens, isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !isAuthenticated || !tokens?.accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCustomerProfile({ tenantId, accessToken: tokens.accessToken })
      .then((data) => {
        if (!cancelled) setProfile(data)
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
  }, [isReady, isAuthenticated, tokens?.accessToken, tenantId])

  return (
    <RequireStorefrontAuth returnPath="/account/profile">
      <AccountPageHeader
        title="Profile"
        subtitle="Your contact details used for orders and delivery updates."
      />

      {loading ? (
        <p className={t.statusLoading}>Loading profile…</p>
      ) : error ? (
        <p role="alert" className={t.error}>
          {error}
        </p>
      ) : (
        <div className={`${t.card} space-y-6`}>
          <div className="flex items-center gap-4">
            {profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePicture}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-100"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
                style={{ backgroundColor: 'var(--site-brand, #171717)' }}
              >
                {(profile?.firstName ?? user?.firstName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-neutral-900">
                {profile ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : user ? displayName(user) : '—'}
              </p>
              <p className={t.textMuted}>Customer account</p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{profile?.email ?? user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{profile?.phone ?? user?.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">First name</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{profile?.firstName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Last name</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{profile?.lastName ?? '—'}</dd>
            </div>
          </dl>

          <p className={`${t.textMuted} text-xs leading-relaxed`}>
            Profile updates from the storefront are coming soon. Contact the store if you need to change your delivery
            details for an open order.
          </p>

          <div className="flex flex-wrap gap-3 border-t border-neutral-100 pt-4">
            <Link href="/account/orders" className={t.btnSecondary}>
              View orders
            </Link>
            <Link href="/" className={t.btnPrimary}>
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </RequireStorefrontAuth>
  )
}
