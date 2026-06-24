/**
 * Runtime-safe env access. Throws loudly at boot if a required value is missing
 * so we never silently render the wrong site in production.
 */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value.trim()
}

/**
 * `process.env.NEXT_PUBLIC_*` is statically inlined by Next at build time, so
 * we have to spell out each access — destructuring or dynamic access breaks.
 */
export const env = {
  API_BASE_URL: required(
    'NEXT_PUBLIC_API_BASE_URL',
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
  /** Server-only revalidate secret; undefined on the client. */
  REVALIDATE_SECRET: process.env.STOREFRONT_REVALIDATE_SECRET,
  /** Vercel Edge Config — optional in dev. */
  EDGE_CONFIG: process.env.EDGE_CONFIG,
  /** Comma-separated platform host suffixes (e.g. `profixer.app,profixer.localhost`). */
  HOST_SUFFIXES: (
    process.env.NEXT_PUBLIC_STOREFRONT_HOST_SUFFIXES ??
    'profixer.app,profixer.localhost,localhost'
  )
    .split(',')
    .map((s) => s.trim().toLowerCase().replace(/^\.+/, ''))
    .filter(Boolean),
  /** Google Identity Services client ID; required for "Continue with Google". */
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined,
}
