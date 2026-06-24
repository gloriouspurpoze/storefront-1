/** B2B account form presets (societies, builders, commercial — ProFixer.in). */

export const B2B_INDUSTRY_PRESETS = [
  'Society / CHS',
  'Builder / developer',
  'Property management',
  'Commercial office',
  'Retail / mall',
  'Hotel / hospitality',
  'Healthcare',
  'Education',
  'Industrial / warehouse',
  'Other',
] as const

export const B2B_EMPLOYEE_BANDS = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '500+',
  'Unknown',
] as const

export const B2B_REVENUE_BANDS = [
  'Under ₹10L',
  '₹10L – ₹50L',
  '₹50L – ₹2Cr',
  '₹2Cr – ₹10Cr',
  '₹10Cr+',
  'Unknown',
] as const

export const B2B_COUNTRY_PRESETS = ['India', 'UAE', 'United Kingdom', 'United States', 'Other'] as const

export const B2B_DEFAULT_COUNTRY = 'India'

export function normalizeCompanyWebsite(raw: string): string | undefined {
  const s = raw.trim()
  if (!s) return undefined
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export function normalizeCompanyPhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return raw.trim() || undefined
  if (digits.length === 10) return digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  return raw.trim()
}
