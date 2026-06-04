import { format, isValid } from 'date-fns'

/**
 * Safe wrapper around date-fns `format`.
 *
 * date-fns throws `RangeError: Invalid time value` when handed an invalid Date
 * (e.g. `new Date(undefined)` or an unparseable string from the API). Admin
 * records routinely have missing/empty timestamps, so every screen must guard
 * against this — call `safeFormat` instead of `format(new Date(x), ...)`.
 */
export function safeFormat(
  value: string | number | Date | null | undefined,
  pattern: string,
  fallback = '—',
): string {
  if (value == null || value === '') return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) return fallback
  try {
    return format(date, pattern)
  } catch {
    return fallback
  }
}

/** First valid date among the candidates, formatted; else fallback. */
export function safeFormatFirst(
  values: Array<string | number | Date | null | undefined>,
  pattern: string,
  fallback = '—',
): string {
  for (const v of values) {
    const out = safeFormat(v, pattern, '')
    if (out) return out
  }
  return fallback
}
