import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'

/**
 * On-demand revalidation webhook. The backend calls this with
 * `x-revalidate-secret` whenever a tenant's storefront data (services, menu,
 * products, theme) changes so the RSC cache for that tenant's tag is busted.
 *
 *   POST /api/revalidate
 *   { "tags": ["tenant:<id>", "tenant:<id>:services"] }
 *
 * Multiple tags are revalidated in one call to keep network chatter low.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret') ?? ''
  if (!process.env.STOREFRONT_REVALIDATE_SECRET || secret !== process.env.STOREFRONT_REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }

  let body: { tags?: unknown } = {}
  try {
    body = (await req.json()) as { tags?: unknown }
  } catch {
    return NextResponse.json({ success: false, message: 'invalid json' }, { status: 400 })
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []
  if (!tags.length) {
    return NextResponse.json({ success: false, message: 'tags[] required' }, { status: 400 })
  }

  for (const tag of tags) revalidateTag(tag)
  return NextResponse.json({ success: true, data: { revalidated: tags } })
}
