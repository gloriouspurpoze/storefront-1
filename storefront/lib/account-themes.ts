export const THEMED_ACCOUNT_KEYS = [
  'private-thebrownbutter',
  'luxe-essence',
  'soft-studio',
] as const

export type ThemedAccountKey = (typeof THEMED_ACCOUNT_KEYS)[number]

export function isThemedAccount(themeKey?: string): themeKey is ThemedAccountKey {
  return THEMED_ACCOUNT_KEYS.includes(themeKey as ThemedAccountKey)
}
