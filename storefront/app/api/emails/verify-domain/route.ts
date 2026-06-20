import { NextResponse, type NextRequest } from 'next/server'
import { extractDomainFromEmail, validateFromEmailFormat } from '@/lib/storefront-email/send'

/**
 * POST /api/emails/verify-domain
 * Body: { from_email }
 *
 * SMTP mode — validates format only. DNS/SPF must be configured at your mail provider.
 */
export async function POST(req: NextRequest) {
  let body: { from_email?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ success: false, message: 'invalid json' }, { status: 400 })
  }

  const fromEmail = body.from_email?.trim()

  if (!fromEmail) {
    return NextResponse.json({ success: false, message: 'from_email is required' }, { status: 400 })
  }

  if (!validateFromEmailFormat(fromEmail)) {
    return NextResponse.json({ success: false, message: 'Invalid from_email' }, { status: 400 })
  }

  const domain = extractDomainFromEmail(fromEmail)
  if (!domain) {
    return NextResponse.json({ success: false, message: 'Invalid from_email' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    data: {
      domain,
      verified: true,
      status: 'smtp_manual',
      transport: 'smtp',
    },
  })
}
