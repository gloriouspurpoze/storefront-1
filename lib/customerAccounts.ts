/**
 * Shopper sign-in policy (`config.customerAccounts`), mirrors fixer-backend
 * `storefront-studio/lib/storefrontCustomerAccounts`.
 *
 * - `required`   — sign in before cart / checkout / booking (default)
 * - `optional`   — guests can order; sign-in still offered
 * - `guest_only` — guests only; account and sign-in links hidden
 */
export type CustomerAccountsMode = 'required' | 'optional' | 'guest_only'

export function resolveCustomerAccountsMode(value: unknown): CustomerAccountsMode {
  return value === 'optional' || value === 'guest_only' ? value : 'required'
}

/** Links into the customer account area (`/account…`), hidden in `guest_only` stores. */
export function isAccountHref(href: string): boolean {
  const path = href.trim().split(/[?#]/)[0]
  return path === '/account' || path.startsWith('/account/')
}

/**
 * Guests (not signed in) must leave a reachable Indian mobile number: it links the order to
 * their OTP account later and the backend refuses pay-later guest orders without one.
 * Returns an error message, or null when the phone is fine / not needed.
 */
export function guestPhoneProblem(
  phone: string | undefined,
  ctx: { isAuthenticated: boolean; guestCheckoutAllowed: boolean },
): string | null {
  if (ctx.isAuthenticated || !ctx.guestCheckoutAllowed) return null
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits)
    ? null
    : 'Please enter a valid 10-digit mobile number so we can reach you about this order.'
}
