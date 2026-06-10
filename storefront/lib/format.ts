/**
 * Shared formatting utilities — no 'use client' so these can be used in both
 * Server Components and Client Components.
 */

export function formatMoney(amount: number, currency: string): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return `${currency} ${amount}`
}
