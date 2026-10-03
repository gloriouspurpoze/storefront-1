/** Tiny className joiner (no clsx dependency in the storefront). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
