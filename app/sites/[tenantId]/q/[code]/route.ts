import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant-resolver'
import { resolveQrScan } from '@/lib/qr-resolve'
import { slugFromPlatformHost } from '@/lib/tenant-resolver'

function storefrontOrigin(host: string, slug: string): string {
  const h = host.toLowerCase()
  if (h.includes('localhost') || h.includes('lvh.me')) {
    return `http://${slug}.lvh.me:3001`
  }
  return `https://${slug}.profixer.app`
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ tenantId: string; code: string }> },
) {
  const { tenantId, code } = await ctx.params
  const h = await headers()
  const host = h.get('host') ?? ''
  const slug =
    slugFromPlatformHost(host) ??
    h.get('x-tenant-slug') ??
    'tenant'
  const verticalKey = h.get('x-tenant-vertical') ?? undefined

  let resolvedSlug = slug
  const tenant = await resolveTenant(host)
  if (tenant) resolvedSlug = tenant.slug

  const origin = storefrontOrigin(host, resolvedSlug)

  try {
    const result = await resolveQrScan({
      tenantId,
      tenantSlug: resolvedSlug,
      verticalKey,
      publicCode: code,
      storefrontOrigin: origin,
    })

    const target = result.redirectUrl
    if (target.startsWith('upi://')) {
      return NextResponse.redirect(target)
    }
    return NextResponse.redirect(target, 302)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'QR not found'
    const url = new URL(origin)
    url.pathname = '/'
    url.searchParams.set('qr_error', msg)
    return NextResponse.redirect(url.toString(), 302)
  }
}
