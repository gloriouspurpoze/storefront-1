/**
 * torqERP marketing site (torqerp.com) — served by this storefront app on its own
 * hosts, outside tenant resolution. See `middleware.ts` and `app/platform/*`.
 *
 * Every value has a production default so a missing env var never breaks the site;
 * set them in Vercel to point at staging or a preview domain.
 */

const DEFAULT_HOSTS = 'torqerp.com,www.torqerp.com,torqerp.in,www.torqerp.in,torqerp.localhost'

function list(raw: string | undefined, fallback: string): string[] {
  return (raw?.trim() || fallback)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export const PLATFORM_BRAND = 'torqERP'

/** Hosts that render the marketing site instead of a tenant storefront (port is ignored). */
export const PLATFORM_HOSTS = list(process.env.PLATFORM_MARKETING_HOSTS, DEFAULT_HOSTS)

/** Canonical origin: every other platform host 301s here, and it is used in canonical URLs + sitemap. */
export const PLATFORM_SITE_URL = trimSlash(process.env.PLATFORM_SITE_URL?.trim() || 'https://torqerp.com')

/** Where sign-in and signup live (the admin app). `next dev` defaults to the local admin on :3000. */
export const PLATFORM_APP_URL = trimSlash(
  process.env.NEXT_PUBLIC_PLATFORM_APP_URL?.trim() ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://app.torqerp.com'),
)

/**
 * CMS tenant that holds torqERP's own blog posts and pages. Unset → blog and CMS
 * pages are simply empty; the hand-built pages still render.
 */
export const PLATFORM_CMS_TENANT_ID = process.env.PLATFORM_CMS_TENANT_ID?.trim() || ''

export const PLATFORM_CONTACT_EMAIL = process.env.PLATFORM_CONTACT_EMAIL?.trim() || 'hello@torqerp.com'

export function hostWithoutPort(host: string): string {
  return host.toLowerCase().replace(/:\d+$/, '')
}

export function isPlatformHost(host: string): boolean {
  return PLATFORM_HOSTS.includes(hostWithoutPort(host))
}

/** Local hosts never redirect to the canonical domain, so dev works on any port. */
export function isLocalPlatformHost(host: string): boolean {
  const h = hostWithoutPort(host)
  return h === 'localhost' || h.endsWith('.localhost')
}

export function siteUrl(path = '/'): string {
  return path === '/' ? `${PLATFORM_SITE_URL}/` : `${PLATFORM_SITE_URL}${path}`
}

export function appUrl(path: string): string {
  return `${PLATFORM_APP_URL}${path}`
}

export function signupUrl(verticalKey?: string): string {
  return appUrl(verticalKey ? `/signup/${verticalKey}` : '/signup')
}

export const SIGN_IN_URL = appUrl('/auth')
