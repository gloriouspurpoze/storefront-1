/**
 * Radix Select throws during render when `value` is set but no matching
 * `<SelectItem value={…}>` exists yet (typical while async options load).
 * React 19 surfaces that as repeated "concurrent rendering … recovered" overlay spam.
 */
export function selectValueWhenListed<T extends string>(
  value: T | undefined | null,
  allowed: readonly T[],
): T | undefined {
  if (value == null || value === '') return undefined
  return allowed.includes(value) ? value : undefined
}
