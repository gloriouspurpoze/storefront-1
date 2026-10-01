'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { accountSkinPrefix } from '@/lib/account-themes'
import { AccountDashboardNav } from './AccountDashboardNav'
import { useAccountTheme } from './AccountThemeContext'

export function AccountDashboardLayout({
  children,
  showWishlist = false,
}: {
  children: ReactNode
  /** Wishlist add-on active — adds the Wishlist account section. */
  showWishlist?: boolean
}) {
  const pathname = usePathname()
  const themeKey = useAccountTheme()
  const skin = accountSkinPrefix(themeKey)
  const isLogin = pathname?.includes('/account/login')

  if (isLogin) {
    return <>{children}</>
  }

  // Brown Butter: shell pill nav owns navigation — avoid double nav + lg sidebar clash.
  if (skin === 'bb') {
    return <>{children}</>
  }

  if (skin === 'mf' || skin === 'le') {
    return (
      <div className={`${skin}-acct-layout`}>
        <AccountDashboardNav showWishlist={showWishlist} />
        <div className={`${skin}-acct-layout-main`}>{children}</div>
      </div>
    )
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <AccountDashboardNav showWishlist={showWishlist} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
