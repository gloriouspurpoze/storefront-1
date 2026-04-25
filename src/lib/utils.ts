import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** India deployment: all customer-facing money is INR (₹). */
export const APP_CURRENCY = 'INR' as const
export const CURRENCY_SYMBOL = '₹'

/**
 * Formats a rupee amount (en-IN locale). Use for list prices, totals, dashboards.
 * Shows up to 2 decimal places when needed (e.g. paise).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats an amount for ISO currency codes (CRM, multi-currency fields). Defaults to INR.
 * Uses en-IN for grouping/separator style.
 */
export function formatMoneyAmount(amount: number, currency: string = APP_CURRENCY): string {
  const c = (currency || APP_CURRENCY).toUpperCase()
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: c }).format(amount)
  } catch {
    if (c === 'INR') {
      return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    }
    return `${c} ${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }
}

// Date formatting utility
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
