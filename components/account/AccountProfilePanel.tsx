'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { accountSkinPrefix } from '@/lib/account-themes'
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
  const skin = accountSkinPrefix(themeKey)
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

  const display =
    profile ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : user ? displayName(user) : '—'
  const initial = (profile?.firstName ?? user?.firstName ?? '?').charAt(0).toUpperCase()
  const shopLabel = skin === 'mf' || skin === 'bb' ? 'Order from menu' : 'Continue shopping'

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
        <div className={`${t.card}${skin ? ` ${skin}-acct-profile` : ' space-y-6'}`}>
          <div className={skin ? `${skin}-acct-profile-head` : 'flex items-center gap-4'}>
            {profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePicture}
                alt=""
                className={skin ? `${skin}-acct-avatar` : 'h-16 w-16 rounded-full object-cover ring-2 ring-neutral-100'}
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
              <p className={skin ? `${skin}-acct-order-num` : 'text-lg font-semibold text-neutral-900'}>{display}</p>
              <p className={t.textMuted}>Customer account</p>
            </div>
          </div>

          <dl className={skin ? `${skin}-acct-profile-dl` : 'grid gap-4 sm:grid-cols-2'}>
            <div>
              <dt className={skin ? `${skin}-acct-stat-label` : 'text-xs font-semibold uppercase tracking-wide text-neutral-500'}>
                Email
              </dt>
              <dd className={skin ? `${skin}-acct-profile-value` : 'mt-1 text-sm font-medium text-neutral-900'}>
                {profile?.email ?? user?.email ?? '—'}
              </dd>
            </div>
            <div>
              <dt className={skin ? `${skin}-acct-stat-label` : 'text-xs font-semibold uppercase tracking-wide text-neutral-500'}>
                Phone
              </dt>
              <dd className={skin ? `${skin}-acct-profile-value` : 'mt-1 text-sm font-medium text-neutral-900'}>
                {profile?.phone ?? user?.phone ?? '—'}
              </dd>
            </div>
            <div>
              <dt className={skin ? `${skin}-acct-stat-label` : 'text-xs font-semibold uppercase tracking-wide text-neutral-500'}>
                First name
              </dt>
              <dd className={skin ? `${skin}-acct-profile-value` : 'mt-1 text-sm font-medium text-neutral-900'}>
                {profile?.firstName ?? '—'}
              </dd>
            </div>
            <div>
              <dt className={skin ? `${skin}-acct-stat-label` : 'text-xs font-semibold uppercase tracking-wide text-neutral-500'}>
                Last name
              </dt>
              <dd className={skin ? `${skin}-acct-profile-value` : 'mt-1 text-sm font-medium text-neutral-900'}>
                {profile?.lastName ?? '—'}
              </dd>
            </div>
          </dl>

          <p className={`${t.textMuted} text-xs leading-relaxed`}>
            Profile updates from the storefront are coming soon. Contact the store if you need to change your delivery
            details for an open order.
          </p>

          <div
            className={
              skin
                ? `${skin}-acct-actions ${skin}-acct-actions--inline`
                : 'flex flex-wrap gap-3 border-t border-neutral-100 pt-4'
            }
          >
            <Link href="/account/orders" className={t.btnSecondary}>
              View orders
            </Link>
            <Link href="/" className={t.btnPrimary}>
              {shopLabel}
            </Link>
          </div>
        </div>
      )}
    </RequireStorefrontAuth>
  )
}
