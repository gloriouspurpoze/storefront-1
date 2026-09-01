'use client'

import type { ReactNode } from 'react'
import { isThemedAccount, THEMED_ACCOUNT_COMPONENTS } from '@/lib/account-themes'
import { AccountShell } from '../AccountShell'
import { AccountThemeProvider } from '../AccountThemeContext'

export interface ThemedAccountShellProps {
  themeKey?: string
  tenantName: string
  logoUrl?: string
  tagline?: string
  children: ReactNode
}

export function ThemedAccountShell({
  themeKey,
  tenantName,
  logoUrl,
  tagline,
  children,
}: ThemedAccountShellProps) {
  const themed = isThemedAccount(themeKey) ? themeKey : undefined

  if (!themed) {
    return (
      <AccountShell tenantName={tenantName} logoUrl={logoUrl} themeKey={themeKey}>
        {children}
      </AccountShell>
    )
  }

  const Shell = THEMED_ACCOUNT_COMPONENTS[themed]
  return (
    <AccountThemeProvider themeKey={themed}>
      <Shell tenantName={tenantName} logoUrl={logoUrl} tagline={tagline}>
        {children}
      </Shell>
    </AccountThemeProvider>
  )
}
