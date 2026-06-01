import { NextResponse, type NextRequest } from 'next/server'
import { resolveTenant } from './lib/tenant-resolver'

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (RESERVED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const host = (req.headers.get('host') ?? '').toLowerCase()
  const tenant = await resolveTenant(host)

  if (!tenant) {
    const url = req.nextUrl.clone()
    url.pathname = '/unknown-host'
    const res = NextResponse.rewrite(url)
    res.headers.set('x-storefront-resolved', 'miss')
    res.headers.set('x-storefront-host', host)
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/.*|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff|woff2|ttf|eot)).*)',
  ],
}
