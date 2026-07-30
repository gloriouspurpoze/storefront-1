'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accountSkinPrefix } from '@/lib/account-themes'
import { displayName } from '@/lib/storefront-auth'
import { useAccountAuth } from './AccountAuthProvider'
import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'

const NAV_ITEMS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/orders/track', label: 'Track order' },
]

function isNavActive(pathname: string | null, href: string, exact?: boolean): boolean {
  if (!pathname) return false
  if (exact) return pathname === href || pathname.endsWith(`${href}/`)
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.endsWith(`${href}/`)
}

export function AccountDashboardNav() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAccountAuth()
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)
  const skin = accountSkinPrefix(themeKey)
  const isLogin = pathname?.includes('/account/login')

  if (isLogin || !isAuthenticated) return null

  // Shell pill nav owns navigation for Brown Butter.
  if (skin === 'bb') return null

  if (skin === 'mf' || skin === 'le') {
    const storeLabel = skin === 'mf' ? 'Back to menu' : 'Continue shopping'
    return (
      <aside className={`${skin}-acct-sidebar`} aria-label="Account sections">
        {user ? (
          <p className={`${skin}-acct-sidebar-user`}>
            <span className={`${skin}-acct-sidebar-label`}>Signed in</span>
            {displayName(user)}
          </p>
        ) : null}
        <nav className={`${skin}-acct-sidebar-nav`} aria-label="Account navigation">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${skin}-acct-sidebar-link${active ? ` ${skin}-acct-sidebar-link--active` : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            className={`${skin}-acct-sidebar-link ${skin}-acct-sidebar-link--button`}
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </nav>
        <Link href="/" className={`${skin}-acct-sidebar-store`}>
          {storeLabel}
        </Link>
      </aside>
    )
  }

  return (
    <aside className="mb-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:mb-0 lg:min-w-[220px] lg:shrink-0">
      <div className="mb-4 border-b border-neutral-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">My account</p>
        {user ? (
          <p className="mt-1 truncate text-sm font-medium text-neutral-900">{displayName(user)}</p>
        ) : null}
      </div>
      <nav className="flex flex-row flex-wrap gap-1 lg:flex-col" aria-label="Account sections">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--site-brand,#171717)] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:mt-2"
        >
          Sign out
        </button>
      </nav>
      <div className="mt-4 hidden border-t border-neutral-100 pt-4 lg:block">
        <Link href="/" className={`${t.link} text-sm`}>
          ← Continue shopping
        </Link>
      </div>
    </aside>
  )
}
