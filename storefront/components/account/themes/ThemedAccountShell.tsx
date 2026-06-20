'use client'

import type { ReactNode } from 'react'
import { isThemedAccount } from '@/lib/account-themes'
import { AccountShell } from '../AccountShell'
import { AccountThemeProvider } from '../AccountThemeContext'
import { BrownButterAccountShell } from './BrownButterAccountShell'
import { LuxeEssenceAccountShell } from './LuxeEssenceAccountShell'
import { SoftStudioAccountShell } from './SoftStudioAccountShell'

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
  const shellProps = { tenantName, logoUrl, tagline, children }

  let shell: ReactNode
  if (themed === 'private-thebrownbutter') {
    shell = <BrownButterAccountShell {...shellProps} />
  } else if (themed === 'luxe-essence') {
    shell = <LuxeEssenceAccountShell {...shellProps} />
  } else if (themed === 'soft-studio') {
    shell = <SoftStudioAccountShell {...shellProps} />
  } else {
    shell = <AccountShell tenantName={tenantName} logoUrl={logoUrl}>{children}</AccountShell>
    return shell
  }

  return <AccountThemeProvider themeKey={themed}>{shell}</AccountThemeProvider>
}
