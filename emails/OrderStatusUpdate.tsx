import { Heading, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import type { OrderStatusUpdateEmailProps } from './types'

export default function OrderStatusUpdate({
  tenant,
  customer,
  order,
}: OrderStatusUpdateEmailProps) {
  const accent = tenant.brand_color || '#FF5C00'

  return (
    <EmailLayout
      brandName={tenant.brand_name}
      brandColor={tenant.brand_color}
      previewText={`Order ${order.id} — ${order.new_status}`}
      showMenufastFooter={!tenant.is_premium}
    >
      <Heading style={h1}>Order update</Heading>
      <Text style={paragraph}>Hi {customer.name || 'there'},</Text>
      <Text style={paragraph}>
        Your order from <strong>{tenant.brand_name}</strong> has been updated.
      </Text>

      <Section style={{ ...statusBox, borderColor: accent }}>
        <Text style={statusLabel}>Current status</Text>
        <Text style={{ ...statusValue, color: accent }}>{order.new_status}</Text>
        <Text style={orderId}>Order #{order.id}</Text>
        {order.estimated_time ? (
          <Text style={eta}>
            <strong>Estimated time:</strong> {order.estimated_time}
          </Text>
        ) : null}
      </Section>

      <Text style={footnote}>
        We&apos;ll notify you when there&apos;s another update. Thank you for ordering with{' '}
        {tenant.brand_name}.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = {
  color: '#18181b',
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '28px',
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const statusBox: React.CSSProperties = {
  backgroundColor: '#fafafa',
  border: '2px solid',
  borderRadius: '8px',
  margin: '20px 0',
  padding: '20px 24px',
  textAlign: 'center',
}

const statusLabel: React.CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  margin: '0 0 8px',
  textTransform: 'uppercase',
}

const statusValue: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '32px',
  margin: '0 0 8px',
}

const orderId: React.CSSProperties = {
  color: '#52525b',
  fontSize: '14px',
  margin: '0 0 8px',
}

const eta: React.CSSProperties = {
  color: '#3f3f46',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0 0',
}

const footnote: React.CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0 0',
}
