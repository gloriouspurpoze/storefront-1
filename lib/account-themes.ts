import type { ComponentType } from 'react'
import type { AccountShellProps } from '@/theme-kit/account/GenericAccountShell'
import { BrownButterAccountShell } from '@/components/account/themes/BrownButterAccountShell'
import { LuxeEssenceAccountShell } from '@/components/account/themes/LuxeEssenceAccountShell'
import { SoftStudioAccountShell } from '@/components/account/themes/SoftStudioAccountShell'
import { SaffronAccountShell } from '@/components/account/themes/SaffronAccountShell'
import { MenuFastAccountShell } from '@/components/account/themes/MenuFastAccountShell'
import { MenuFastCardsAccountShell } from '@/components/account/themes/MenuFastCardsAccountShell'

export const THEMED_ACCOUNT_KEYS = [
  'private-thebrownbutter',
  'luxe-essence',
  'soft-studio',
  'saffron',
  'menufast-minimal',
  'menufast-cards',
] as const

export type ThemedAccountKey = (typeof THEMED_ACCOUNT_KEYS)[number]

/** CSS class prefix for themed dashboard chrome (`{prefix}-acct-stats`, etc.). */
export type AccountSkinPrefix = 'bb' | 'le' | 'mf'

export function isThemedAccount(themeKey?: string): themeKey is ThemedAccountKey {
  return THEMED_ACCOUNT_KEYS.includes(themeKey as ThemedAccountKey)
}

/** Map layout theme keys to account theme class namespace. */
export function accountThemeKey(themeKey?: string): ThemedAccountKey | undefined {
  if (!themeKey) return undefined
  if (isThemedAccount(themeKey)) return themeKey
  return undefined
}

export const THEMED_ACCOUNT_COMPONENTS: Record<ThemedAccountKey, ComponentType<AccountShellProps>> = {
  'private-thebrownbutter': BrownButterAccountShell,
  'luxe-essence': LuxeEssenceAccountShell,
  'soft-studio': SoftStudioAccountShell,
  saffron: SaffronAccountShell,
  'menufast-minimal': MenuFastAccountShell,
  'menufast-cards': MenuFastCardsAccountShell,
}

/** Themes with dedicated dashboard layout/stat/profile class sets. */
export function accountSkinPrefix(themeKey?: string): AccountSkinPrefix | null {
  switch (themeKey) {
    case 'private-thebrownbutter':
      return 'bb'
    case 'luxe-essence':
      return 'le'
    case 'menufast-cards':
      return 'mf'
    default:
      return null
  }
}
