'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { AccountPageHeader } from '@/components/account/AccountPageHeader'
import { OrderTrackingPanel } from '@/components/account/OrderTrackingPanel'
import { useAccountTheme } from '@/components/account/AccountThemeContext'
import { accountThemeClasses } from '@/components/account/accountThemeClasses'
import {
  fetchCustomerOrderTracking,
  fetchPublicOrderTracking,
  type PublicOrderTracking,
} from '@/lib/storefront-api'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import type { ThemeTenant } from './types'

export function TrackOrderClient({ tenant }: { tenant: ThemeTenant }) {
  const searchParams = useSearchParams()
  const { tokens, isAuthenticated, isReady } = useAccountAuth()
  const { email: prefillEmail, phone: prefillPhone, lockedEmail } = useCheckoutCustomerPrefill()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const autoLookupKey = useRef<string | null>(null)

  const [orderNumber, setOrderNumber] = useState(() => searchParams.get('orderNumber') ?? '')
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [phone, setPhone] = useState(() => searchParams.get('phone') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicOrderTracking | null>(null)

  const lookupOrder = useCallback(
    async (number: string, opts?: { email?: string; phone?: string }) => {
      const trimmed = number.trim()
      if (!trimmed) return

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        if (isAuthenticated && tokens?.accessToken) {
          const data = await fetchCustomerOrderTracking({
            tenantId: tenant.id,
            accessToken: tokens.accessToken,
            orderNumber: trimmed,
          })
          if (data) {
            setResult(data)
            return
          }
        }

        const contactEmail =
          opts?.email?.trim() ||
          (lockedEmail && prefillEmail ? prefillEmail : email.trim())
        const contactPhone = opts?.phone?.trim() || prefillPhone || phone.trim()
        if (!contactEmail && !contactPhone) {
          setError('Enter the email or phone number you used at checkout.')
          return
        }

        const data = await fetchPublicOrderTracking({
          tenantId: tenant.id,
          orderNumber: trimmed,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
        })
        if (!data) {
          setError('No order found for that order number and contact details.')
          return
        }
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not look up your order. Try again.')
      } finally {
        setLoading(false)
      }
    },
    [
      isAuthenticated,
      tokens?.accessToken,
      tenant.id,
      lockedEmail,
      prefillEmail,
      prefillPhone,
      email,
      phone,
    ],
  )

  useEffect(() => {
    if (!isReady) return

    const fromUrl = searchParams.get('orderNumber')?.trim()
    const emailFromUrl = searchParams.get('email')?.trim() ?? ''
    const phoneFromUrl = searchParams.get('phone')?.trim() ?? ''
    if (!fromUrl) return

    setOrderNumber(fromUrl)
    if (emailFromUrl) setEmail(emailFromUrl)
    if (phoneFromUrl) setPhone(phoneFromUrl)

    const key = [
      fromUrl,
      isAuthenticated ? 'auth' : 'guest',
      emailFromUrl,
      phoneFromUrl,
    ].join('|')
    if (autoLookupKey.current === key) return

    if (isAuthenticated && tokens?.accessToken) {
      autoLookupKey.current = key
      void lookupOrder(fromUrl)
      return
    }

    if (emailFromUrl || phoneFromUrl) {
      autoLookupKey.current = key
      void lookupOrder(fromUrl, { email: emailFromUrl, phone: phoneFromUrl })
    }
  }, [isReady, isAuthenticated, tokens?.accessToken, searchParams, lookupOrder])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await lookupOrder(orderNumber)
  }

  return (
    <div className={t.contentWrap}>
      <AccountPageHeader
        title="Track your order"
        subtitle={
          isAuthenticated
            ? 'Enter an order number — we look it up from your account.'
            : 'See delivery status and carrier tracking for your purchase.'
        }
      />

      {isAuthenticated ? (
        <div className="mb-4 space-y-3">
          <p className={t.textMuted}>
            <Link href="/account" className={t.link}>
              View all orders
            </Link>
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className={`${t.card} ${t.form}`}>
        {!isAuthenticated ? (
          <p className={t.text}>
            Enter your order number and the email or phone you used at checkout.{' '}
            <Link href="/account/login" className={t.link}>
              Sign in
            </Link>{' '}
            to skip contact fields.
          </p>
        ) : null}

        <label className={t.label}>
          <span>Order number</span>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className={t.input}
            placeholder="ORD-…"
          />
        </label>

        {!isAuthenticated ? (
          <>
            <label className={t.label}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={t.input}
                placeholder="Optional if you used phone at checkout"
              />
            </label>
            <label className={t.label}>
              <span>Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={t.input}
                placeholder="10-digit mobile"
              />
            </label>
          </>
        ) : null}

        {error ? <p className={t.error}>{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className={`${t.btnPrimary} ${t.btnBlock}`}
        >
          {loading ? 'Looking up…' : 'Track order'}
        </button>
      </form>

      {result ? (
        <div className="mt-8">
          <OrderTrackingPanel tracking={result} brandColor={tenant.brand} />
        </div>
      ) : null}

      <p className={t.trackFooter}>
        <Link href="/account" className={t.trackFooterLink}>
          Order history
        </Link>
        {' · '}
        <Link href="/" className={t.trackFooterLink}>
          Continue shopping
        </Link>
      </p>
    </div>
  )
}
