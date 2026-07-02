'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { buildStorefrontLoginUrl } from '@/lib/storefrontLoginUrls'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'

export type RequireStorefrontAuthProps = {
  children: ReactNode
  /** Path to return to after login. Defaults to current pathname. */
  returnPath?: string
  title?: string
  message?: string
}

/** Blocks cart/checkout until the customer signs in. */
export function RequireStorefrontAuth({
  children,
  returnPath,
  title = 'Sign in to continue',
  message = 'Create a free account or sign in to add items to your cart and place orders.',
}: RequireStorefrontAuthProps) {
  const pathname = usePathname()
  const { isReady, isAuthenticated } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const loginHref = buildStorefrontLoginUrl(returnPath ?? pathname ?? '/cart', { signup: true })
  const signInHref = buildStorefrontLoginUrl(returnPath ?? pathname ?? '/cart')

  if (!isReady) {
    return (
      <div className={t.emptyState}>
        <p className={t.statusLoading}>Checking your session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={`${t.emptyState} max-w-lg mx-auto`}>
        <p className={t.emptyTitle}>{title}</p>
        <p className={`${t.textMuted} mt-2`}>{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={loginHref} className={`${t.btnPrimary} ${t.btnBlock} sm:w-auto sm:px-8`}>
            Create account
          </Link>
          <Link href={signInHref} className={`${t.btnSecondary} ${t.btnBlock} sm:w-auto sm:px-8`}>
            Sign in
          </Link>
        </div>
        <p className={`${t.textMuted} mt-6 text-xs`}>
          Orders are linked to your account for easy tracking and reordering.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
