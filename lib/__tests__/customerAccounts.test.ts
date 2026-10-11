import { describe, expect, it } from 'vitest'
import { guestPhoneProblem, isAccountHref, resolveCustomerAccountsMode } from '../customerAccounts'

describe('resolveCustomerAccountsMode', () => {
  it('defaults to required', () => {
    expect(resolveCustomerAccountsMode(undefined)).toBe('required')
    expect(resolveCustomerAccountsMode('bogus')).toBe('required')
    expect(resolveCustomerAccountsMode('optional')).toBe('optional')
    expect(resolveCustomerAccountsMode('guest_only')).toBe('guest_only')
  })
})

describe('guestPhoneProblem', () => {
  const guest = { isAuthenticated: false, guestCheckoutAllowed: true }

  it('requires a valid Indian mobile from guests', () => {
    expect(guestPhoneProblem('', guest)).toMatch(/10-digit mobile/)
    expect(guestPhoneProblem('12345', guest)).toMatch(/10-digit mobile/)
    expect(guestPhoneProblem('98765 43210', guest)).toBeNull()
    expect(guestPhoneProblem('+91 98765-43210', guest)).toBeNull()
    expect(guestPhoneProblem('09876543210', guest)).toBeNull()
  })

  it('does not apply to signed-in shoppers or login-required stores', () => {
    expect(guestPhoneProblem('', { isAuthenticated: true, guestCheckoutAllowed: true })).toBeNull()
    expect(guestPhoneProblem('', { isAuthenticated: false, guestCheckoutAllowed: false })).toBeNull()
  })
})

describe('isAccountHref', () => {
  it('matches the account area only', () => {
    expect(isAccountHref('/account')).toBe(true)
    expect(isAccountHref('/account/login?signup=1')).toBe(true)
    expect(isAccountHref('/accounting')).toBe(false)
    expect(isAccountHref('/orders/track')).toBe(false)
  })
})
