import { NextResponse, type NextRequest } from 'next/server'
import { render } from '@react-email/render'
import BookingConfirmation, { type BookingConfirmationEmailProps } from '@/emails/BookingConfirmation'
import { isSmtpConfigured, platformFromAddress, sendViaSmtp } from '@/lib/storefront-email/smtp'

const EMAIL_SECRET = process.env.STOREFRONT_EMAIL_SECRET || process.env.STOREFRONT_REVALIDATE_SECRET
const PLATFORM_NAME = 'Menufast'

interface BookingEmailRequest {
  to?: string
  tier?: {
    isPremium?: boolean
    brandName?: string
    fromEmail?: string
    emailDisplayName?: string
    replyTo?: string
  }
  booking?: BookingConfirmationEmailProps
}

/**
 * POST /api/emails/booking — Service booking add-on confirmation.
 * Called by fixer-backend `StorefrontBookingEmailService` with the full render payload
 * (bookings are CRM deals, so there is no order context to call back for).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-storefront-email-secret') ?? ''
  if (!EMAIL_SECRET || secret !== EMAIL_SECRET) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }

  let body: BookingEmailRequest
  try {
    body = (await req.json()) as BookingEmailRequest
  } catch {
    return NextResponse.json({ success: false, message: 'invalid json' }, { status: 400 })
  }

  const to = body.to?.trim()
  const booking = body.booking
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !booking?.booking?.reference || !booking.tenant?.brand_name) {
    return NextResponse.json({ success: false, message: 'to and booking payload are required' }, { status: 400 })
  }
  if (!isSmtpConfigured()) {
    return NextResponse.json({ success: false, message: 'SMTP is not configured on the storefront' }, { status: 503 })
  }

  const tier = body.tier ?? {}
  const displayName = tier.emailDisplayName || tier.brandName || booking.tenant.brand_name
  const from =
    tier.isPremium && tier.fromEmail
      ? `${displayName} <${tier.fromEmail}>`
      : `${displayName} via ${PLATFORM_NAME} <${platformFromAddress()}>`

  try {
    const html = await render(BookingConfirmation(booking))
    const result = await sendViaSmtp({
      from,
      to,
      subject: `Booking request received — ${booking.booking.reference}`,
      html,
      replyTo: tier.replyTo,
    })
    return NextResponse.json({ success: true, data: { messageId: result.messageId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    console.error('[storefront/emails/booking]', message)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
