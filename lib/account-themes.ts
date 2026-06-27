export const THEMED_ACCOUNT_KEYS = [
  'private-thebrownbutter',
  'luxe-essence',
  'soft-studio',
  'saffron',
  'menufast-minimal',
  'menufast-cards',
] as const

export type ThemedAccountKey = (typeof THEMED_ACCOUNT_KEYS)[number]

export function isThemedAccount(themeKey?: string): themeKey is ThemedAccountKey {
  return THEMED_ACCOUNT_KEYS.includes(themeKey as ThemedAccountKey)
}

/** Map layout theme keys to account theme class namespace. */
export function accountThemeKey(themeKey?: string): ThemedAccountKey | undefined {
  if (!themeKey) return undefined
  if (isThemedAccount(themeKey)) return themeKey
  return undefined
}
