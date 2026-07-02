'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AccountDashboardNav } from './AccountDashboardNav'
import { useAccountTheme } from './AccountThemeContext'

export function AccountDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const themeKey = useAccountTheme()
  const isLogin = pathname?.includes('/account/login')
  const isCards = themeKey === 'menufast-cards'

  if (isLogin) {
    return <>{children}</>
  }

  if (isCards) {
    return (
      <div className="mf-acct-layout">
        <AccountDashboardNav />
        <div className="mf-acct-layout-main">{children}</div>
      </div>
    )
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <AccountDashboardNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
