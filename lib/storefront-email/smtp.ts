import nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer'

let cached: Transporter | null = null

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || ''
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
  return Boolean(user.trim() && pass.trim())
}

export function getSmtpTransporter(): Transporter {
  if (cached) return cached

  const user = process.env.SMTP_USER || process.env.EMAIL_USER || ''
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
  if (!user.trim() || !pass.trim()) {
    throw new Error(
      'SMTP is not configured. Set SMTP_USER + SMTP_PASS (or EMAIL_USER + EMAIL_PASSWORD) on the storefront.',
    )
  }

  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10)
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465

  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user: user.trim(), pass: pass.trim() },
  })

  return cached
}

/** Platform From address for Tier 1 (free/local) sends. */
export function platformFromAddress(): string {
  return (
    process.env.STOREFRONT_SMTP_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    'orders@menufast.in'
  ).trim()
}

export interface SmtpSendInput {
  from: string
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendViaSmtp(input: SmtpSendInput): Promise<{ messageId?: string }> {
  const transporter = getSmtpTransporter()
  const info = await transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  })
  return { messageId: info.messageId }
}
