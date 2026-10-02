/**
 * Canonical-host redirect: once a store has a verified primary custom domain, every other
 * address it answers on (platform subdomain, www / non-www twin, secondary domains) gets a
 * 301 to the primary so search engines index one site.
 *
 * Skipped for: local dev hosts, non-GET/HEAD requests, and draft previews (the preview
 * cookie lives on the host it was opened on).
 */
const LOCAL_HOST_RE = /(^|\.)(localhost|lvh\.me)$|^127\.0\.0\.1$|\.localhost$/

export function primaryRedirectUrl(input: {
  host: string
  primaryHost: string | null | undefined
  method: string
  pathname: string
  search: string
  hasPreview: boolean
  disabled?: boolean
}): string | null {
  const host = input.host.split(':')[0]?.toLowerCase() ?? ''
  const primary = (input.primaryHost ?? '').toLowerCase()
  if (input.disabled || !primary || !host || host === primary) return null
  if (LOCAL_HOST_RE.test(host)) return null
  if (input.method !== 'GET' && input.method !== 'HEAD') return null
  if (input.hasPreview) return null
  return `https://${primary}${input.pathname}${input.search}`
}
