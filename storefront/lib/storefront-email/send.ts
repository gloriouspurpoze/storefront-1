import { render } from '@react-email/render'
import OrderConfirmation from '@/emails/OrderConfirmation'
import OrderStatusUpdate from '@/emails/OrderStatusUpdate'
import type {
  OrderConfirmationEmailProps,
  OrderStatusUpdateEmailProps,
  StorefrontEmailType,
} from '@/emails/types'
import { isSmtpConfigured, platformFromAddress, sendViaSmtp } from './smtp'

const PLATFORM_NAME = 'Menufast'

export interface SendTierConfig {
  isPremium: boolean
  brandName: string
  fromEmail?: string
  emailDisplayName?: string
  replyTo?: string
}

export interface SendStorefrontEmailInput {
  type: StorefrontEmailType
  to: string
  tier: SendTierConfig
  confirmation?: OrderConfirmationEmailProps
  statusUpdate?: OrderStatusUpdateEmailProps
}

function resolveFromHeader(tier: SendTierConfig): { from: string; replyTo?: string } {
  const displayName = tier.emailDisplayName || tier.brandName

  if (tier.isPremium && tier.fromEmail) {
    return {
      from: `${displayName} <${tier.fromEmail}>`,
      replyTo: tier.replyTo,
    }
  }

  const platformFrom = platformFromAddress()
  return {
    from: `${displayName} via ${PLATFORM_NAME} <${platformFrom}>`,
    replyTo: tier.replyTo,
  }
}

export async function sendStorefrontEmail(input: SendStorefrontEmailInput): Promise<{ id?: string }> {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP is not configured on the storefront')
  }

  const { from, replyTo } = resolveFromHeader(input.tier)

  let subject: string
  let html: string

  if (input.type === 'order_confirmation' && input.confirmation) {
    subject = `Order confirmed — ${input.confirmation.order.id}`
    html = await render(OrderConfirmation(input.confirmation))
  } else if (input.type === 'order_status_update' && input.statusUpdate) {
    subject = `Order update: ${input.statusUpdate.order.new_status} — ${input.statusUpdate.order.id}`
    html = await render(OrderStatusUpdate(input.statusUpdate))
  } else {
    throw new Error('Invalid email payload for type')
  }

  const result = await sendViaSmtp({
    from,
    to: input.to,
    subject,
    html,
    replyTo,
  })

  return { id: result.messageId }
}

export function extractDomainFromEmail(email: string): string | null {
  const at = email.indexOf('@')
  if (at < 1) return null
  return email.slice(at + 1).trim().toLowerCase() || null
}

/** Basic format check — no external provider verification (SMTP mode). */
export function validateFromEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
