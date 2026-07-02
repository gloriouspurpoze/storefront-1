'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AccountDashboardNav } from './AccountDashboardNav'

export function AccountDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname?.includes('/account/login')

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <AccountDashboardNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
