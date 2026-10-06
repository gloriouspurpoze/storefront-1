import { NextResponse, type NextRequest } from 'next/server'
import { resolveTenant } from './lib/tenant-resolver'
import { primaryRedirectUrl } from './lib/primaryDomainRedirect'
import { PREVIEW_COOKIE } from './lib/storefrontPreview'
import { PLATFORM_SITE_URL, hostWithoutPort, isLocalPlatformHost, isPlatformHost } from './platform/config'

/**
 * Host-based tenant routing.
 *
 * For every incoming request:
 *   1. Skip static assets, framework internals, and the public `/api/*` routes.
 *   2. Resolve `Host` → tenant via the resolver cascade (Edge Config → API).
 *   3. Rewrite the URL into `/sites/[tenantId]/...` so the App Router can pick
 *      up the tenant id from the dynamic segment.
 *   4. Stamp `x-tenant-id`, `x-tenant-slug`, `x-tenant-vertical`, `x-tenant-name`
 *      headers so RSC + server actions don't have to re-query.
 *
 * If the host resolves to nothing the request falls through to `/unknown-host`
 * (custom 404 page) — never leaks to a random tenant's content.
 *
 * Note: folders prefixed with `_` are private in the App Router and do not
 * create routes — use `sites/` not `_sites/`.
 */
const RESERVED_PATH_PREFIXES = [
  '/_next',
  '/static',
  '/favicon',
  '/api',
  '/sites',
  '/unknown-host',
]

/** Framework internals and API routes pass through untouched on the marketing hosts too. */
const PLATFORM_PASSTHROUGH_PREFIXES = ['/_next', '/static', '/favicon', '/api']

/** Tenant hosts keep serving these from outside the middleware, as before. */
const TENANT_UNTOUCHED_PATHS = new Set(['/robots.txt', '/sitemap.xml'])

/**
 * torqERP marketing site: platform hosts render `app/platform/*` and never hit
 * tenant resolution. Non-canonical hosts (www., torqerp.in) 301 to the canonical
 * origin so Google sees one URL per page.
 */
function platformResponse(req: NextRequest, host: string): NextResponse {
  const { pathname, search } = req.nextUrl
  if (PLATFORM_PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const canonical = new URL(PLATFORM_SITE_URL)
  if (!isLocalPlatformHost(host) && hostWithoutPort(host) !== canonical.hostname) {
    return NextResponse.redirect(`${canonical.origin}${pathname}${search}`, 301)
  }

  const url = req.nextUrl.clone()
  url.pathname = `/platform${pathname === '/' ? '' : pathname}`
  const res = NextResponse.rewrite(url)
  res.headers.set('x-storefront-resolved', 'platform')
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = (req.headers.get('host') ?? '').toLowerCase()

  if (isPlatformHost(host)) {
    return platformResponse(req, host)
  }
  // Marketing pages are only reachable through the platform hosts.
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    const url = req.nextUrl.clone()
    url.pathname = '/unknown-host'
    return NextResponse.rewrite(url)
  }

  if (TENANT_UNTOUCHED_PATHS.has(pathname) || RESERVED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const tenant = await resolveTenant(host)

  if (!tenant) {
    const url = req.nextUrl.clone()
    url.pathname = '/unknown-host'
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-storefront-host', host)
    const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    res.headers.set('x-storefront-resolved', 'miss')
    res.headers.set('x-storefront-host', host)
    return res
  }

  // One canonical address per store: 301 every other host to the verified primary domain.
  const redirectTo = primaryRedirectUrl({
    host,
    primaryHost: tenant.primaryHost,
    method: req.method,
    pathname,
    search: req.nextUrl.search,
    hasPreview:
      req.cookies.has(PREVIEW_COOKIE) ||
      req.nextUrl.searchParams.has('previewVersion') ||
      req.nextUrl.searchParams.has('previewToken'),
    disabled: process.env.STOREFRONT_PRIMARY_DOMAIN_REDIRECT === 'off',
  })
  if (redirectTo) {
    const res = NextResponse.redirect(redirectTo, 301)
    res.headers.set('x-storefront-resolved', 'primary-redirect')
    return res
  }

  const url = req.nextUrl.clone()
  url.pathname = `/sites/${tenant.id}${pathname === '/' ? '' : pathname}`

  const res = NextResponse.rewrite(url)
  res.headers.set('x-storefront-resolved', tenant.matchedBy)
  res.headers.set('x-tenant-id', tenant.id)
  res.headers.set('x-tenant-slug', tenant.slug)
  res.headers.set('x-tenant-vertical', tenant.verticalKey)
  res.headers.set('x-tenant-name', encodeURIComponent(tenant.name))
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff|woff2|ttf|eot)).*)',
  ],
}
