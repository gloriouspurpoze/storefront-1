import { NextResponse, type NextRequest } from 'next/server'
import {
  PREVIEW_COOKIE,
  PREVIEW_MAX_AGE_SECONDS,
  buildPreviewCookieValue,
} from '@/lib/storefrontPreview'

/**
 * Draft preview entry/exit.
 *
 *   GET /api/preview?v=<24-hex versionId>&t=<token>  → set `sf_preview`, redirect to `/`
 *   GET /api/preview?exit=1                          → clear `sf_preview`, redirect to `/`
 *
 * Invalid params redirect to `/` without touching the cookie. The redirect stays
 * on the host the request came in on (multi-tenant by host; `/api/*` skips the
 * tenant rewrite in middleware, so `req.url` may carry an internal origin).
 */
export const dynamic = 'force-dynamic'

function firstHeaderValue(v: string | null): string {
  return (v ?? '').split(',')[0]?.trim() ?? ''
}

function homeUrl(req: NextRequest): URL {
  const host =
    firstHeaderValue(req.headers.get('x-forwarded-host')) ||
    firstHeaderValue(req.headers.get('host')) ||
    req.nextUrl.host
  const proto =
    firstHeaderValue(req.headers.get('x-forwarded-proto')) ||
    req.nextUrl.protocol.replace(/:$/, '') ||
    'https'
  try {
    return new URL('/', `${proto}://${host}`)
  } catch {
    return new URL('/', req.nextUrl.origin)
  }
}

function redirectHome(req: NextRequest): NextResponse {
  const res = NextResponse.redirect(homeUrl(req), 307)
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  if (sp.get('exit') === '1') {
    const res = redirectHome(req)
    res.cookies.delete(PREVIEW_COOKIE)
    return res
  }

  const value = buildPreviewCookieValue(sp.get('v') ?? '', sp.get('t') ?? '')
  const res = redirectHome(req)
  if (!value) return res

  res.cookies.set(PREVIEW_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: PREVIEW_MAX_AGE_SECONDS,
  })
  return res
}
