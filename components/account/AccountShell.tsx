'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { themeRootClass } from '@/lib/theme-classes'
import { useAccountAuth } from './AccountAuthProvider'
import { displayName } from '@/lib/storefront-auth'

interface AccountShellProps {
  tenantName: string
  logoUrl?: string
  themeKey?: string
  children: ReactNode
}

export function AccountShell({ tenantName, logoUrl, themeKey, children }: AccountShellProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAccountAuth()
  const isLogin = pathname?.endsWith('/login')
  const rootClass = themeRootClass(themeKey)

  return (
    <div className={`min-h-screen bg-white text-neutral-900 ${rootClass}`}>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-neutral-900">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-7 w-7 rounded-md object-cover" />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--site-brand)' }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-medium">{tenantName}</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-neutral-500 hover:text-neutral-900">
              Store
            </Link>
            {isAuthenticated && !isLogin ? (
              <>
                <Link
                  href="/account"
                  className={
                    pathname === '/account' || pathname?.endsWith('/account/')
                      ? 'font-medium text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }
                >
                  Orders
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-neutral-500 hover:text-neutral-900"
                >
                  Sign out
                </button>
              </>
            ) : !isLogin ? (
              <>
                <Link href="/account/login" className="text-neutral-500 hover:text-neutral-900">
                  Sign in
                </Link>
                <Link href="/account/login?signup=1" className="font-medium text-neutral-900">
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400">
          Signed in as {displayName(user)}
        </footer>
      ) : null}
    </div>
  )
}
