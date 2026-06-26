import { NextResponse, type NextRequest } from 'next/server'
import type { QrCodeRecord } from '@profixer/utils'
import { writeQrRegistry } from '@/lib/qr-registry'

/**
 * Dev-only: sync QR registry from admin localStorage to storefront filesystem.
 * POST { tenantId, codes: QrCodeRecord[] }
 */
export async function OPTIONS() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { tenantId?: string; codes?: QrCodeRecord[] }
  try {
    body = (await req.json()) as { tenantId?: string; codes?: QrCodeRecord[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tenantId || !Array.isArray(body.codes)) {
    return NextResponse.json({ error: 'tenantId and codes required' }, { status: 400 })
  }

  await writeQrRegistry(body.tenantId, body.codes)
  return NextResponse.json(
    { success: true, count: body.codes.length },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
