import { NextResponse, type NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { headers } from 'next/headers'
import { resolveTenant, slugFromPlatformHost } from '@/lib/tenant-resolver'
import { qrPayloadUrl, resolveQrScan } from '@/lib/qr-resolve'

function storefrontOrigin(host: string, slug: string): string {
  const h = host.toLowerCase()
  if (h.includes('localhost') || h.includes('lvh.me')) {
    return `http://${slug}.lvh.me:3001`
  }
  return `https://${slug}.profixer.app`
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params
  const h = await headers()
  const host = h.get('host') ?? ''
  const tenantId = h.get('x-tenant-id')
  const slugHeader = h.get('x-tenant-slug')

  let tenant = tenantId && slugHeader
    ? { id: tenantId, slug: slugHeader, verticalKey: h.get('x-tenant-vertical') ?? undefined }
    : null

  if (!tenant) {
    const resolved = await resolveTenant(host)
    if (resolved) {
      tenant = {
        id: resolved.id,
        slug: resolved.slug,
        verticalKey: resolved.verticalKey,
      }
    }
  }

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const slug = tenant.slug ?? slugFromPlatformHost(host) ?? 'tenant'
  const origin = storefrontOrigin(host, slug)
  const size = Math.min(1024, Math.max(128, parseInt(req.nextUrl.searchParams.get('size') ?? '512', 10) || 512))

  let payload: string
  try {
    const result = await resolveQrScan({
      tenantId: tenant.id,
      tenantSlug: slug,
      verticalKey: tenant.verticalKey,
      publicCode: code,
      storefrontOrigin: origin,
    })
    payload = result.redirectUrl.startsWith('upi://')
      ? result.redirectUrl
      : qrPayloadUrl({
          tenantId: tenant.id,
          tenantSlug: slug,
          publicCode: code,
          storefrontOrigin: origin,
        })
  } catch {
    payload = qrPayloadUrl({
      tenantId: tenant.id,
      tenantSlug: slug,
      publicCode: code,
      storefrontOrigin: origin,
    })
  }

  const png = await QRCode.toBuffer(payload, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'Q',
    color: { dark: '#111111', light: '#ffffff' },
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
