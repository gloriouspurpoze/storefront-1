import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { sendStorefrontEmail } from '@/lib/storefront-email/send'
import type {
  OrderConfirmationEmailProps,
  OrderStatusUpdateEmailProps,
  SendStorefrontEmailRequest,
  StorefrontEmailType,
} from '@/emails/types'

const EMAIL_SECRET = process.env.STOREFRONT_EMAIL_SECRET || process.env.STOREFRONT_REVALIDATE_SECRET

interface EmailContextResponse {
  success: boolean
  data?: {
    to: string
    tier: {
      isPremium: boolean
      brandName: string
      fromEmail?: string
      emailDisplayName?: string
      resendApiKey?: string
      replyTo?: string
    }
    confirmation?: OrderConfirmationEmailProps
    statusUpdate?: OrderStatusUpdateEmailProps
  }
  message?: string
}

async function fetchEmailContext(
  type: StorefrontEmailType,
  tenantId: string,
  orderId: string,
  newStatus?: string,
): Promise<EmailContextResponse> {
  const params = new URLSearchParams({
    tenant_id: tenantId,
    order_id: orderId,
    type,
  })
  if (newStatus) params.set('new_status', newStatus)

  const res = await fetch(`${env.API_BASE_URL}/internal/storefront/emails/context?${params}`, {
    headers: {
      'x-storefront-email-secret': EMAIL_SECRET || '',
    },
    cache: 'no-store',
  })

  return (await res.json()) as EmailContextResponse
}

/**
 * POST /api/emails/send
 * Body: { type, tenant_id, order_id, new_status? }
 *
 * Called by fixer-backend after order placement or status change.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-storefront-email-secret') ?? ''
  if (!EMAIL_SECRET || secret !== EMAIL_SECRET) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }

  let body: SendStorefrontEmailRequest
  try {
    body = (await req.json()) as SendStorefrontEmailRequest
  } catch {
    return NextResponse.json({ success: false, message: 'invalid json' }, { status: 400 })
  }

  const { type, tenant_id, order_id, new_status } = body
  if (!type || !tenant_id?.trim() || !order_id?.trim()) {
    return NextResponse.json(
      { success: false, message: 'type, tenant_id, and order_id are required' },
      { status: 400 },
    )
  }

  if (type !== 'order_confirmation' && type !== 'order_status_update') {
    return NextResponse.json({ success: false, message: 'invalid type' }, { status: 400 })
  }

  try {
    const ctx = await fetchEmailContext(type, tenant_id.trim(), order_id.trim(), new_status)
    if (!ctx.success || !ctx.data?.to) {
      return NextResponse.json(
        { success: false, message: ctx.message || 'Could not build email context' },
        { status: 422 },
      )
    }

    const { to, tier, confirmation, statusUpdate } = ctx.data

    const result = await sendStorefrontEmail({
      type,
      to,
      tier,
      confirmation,
      statusUpdate,
    })

    return NextResponse.json({ success: true, data: { messageId: result.id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    console.error('[storefront/emails/send]', message)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
