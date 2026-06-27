import { Heading, Hr, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import type { OrderConfirmationEmailProps } from './types'

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}


export default function OrderConfirmation({
  tenant,
  customer,
  order,
  payment_method,
}: OrderConfirmationEmailProps) {
  const accent = tenant.brand_color || '#FF5C00'

  return (
    <EmailLayout
      brandName={tenant.brand_name}
      brandColor={tenant.brand_color}
      logoUrl={tenant.logo_url}
      previewText={`Your order ${order.id} from ${tenant.brand_name} is confirmed`}
      showMenufastFooter={!tenant.is_premium}
    >
      <Heading style={h1}>Order confirmed</Heading>
      <Text style={paragraph}>Hi {customer.name || 'there'},</Text>
      <Text style={paragraph}>
        Thanks for your order at <strong>{tenant.brand_name}</strong>. We&apos;ve received it and
        will start preparing it shortly.
      </Text>

      <Section style={{ ...orderBox, borderLeftColor: accent }}>
        <Text style={orderMeta}>
          <strong>Order #</strong> {order.id}
        </Text>
        {order.estimated_time ? (
          <Text style={orderMeta}>
            <strong>Estimated ready time</strong> {order.estimated_time}
          </Text>
        ) : null}
        <Text style={orderMeta}>
          <strong>Payment</strong> {payment_method === 'COD' ? 'Cash on delivery' : 'Paid online'}
        </Text>
        {customer.phone ? (
          <Text style={orderMeta}>
            <strong>Phone</strong> {customer.phone}
          </Text>
        ) : null}
      </Section>

      <Hr style={itemDivider} />

      <Text style={sectionLabel}>Items</Text>
      {order.items.map((item, i) => (
        <Section key={`${item.name}-${i}`} style={itemRow}>
          <Text style={itemName}>
            {item.qty}× {item.name}
          </Text>
          <Text style={itemPrice}>{formatInr(item.price * item.qty)}</Text>
        </Section>
      ))}

      <Hr style={itemDivider} />

      <Section style={totalRow}>
        <Text style={totalLabel}>Total</Text>
        <Text style={{ ...totalAmount, color: accent }}>{formatInr(order.total)}</Text>
      </Section>

      <Text style={footnote}>
        If you have questions about your order, reply to this email and we&apos;ll get back to you.
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

const orderBox: React.CSSProperties = {
  backgroundColor: '#fafafa',
  borderLeft: '4px solid',
  borderRadius: '6px',
  margin: '20px 0',
  padding: '12px 16px',
}

const orderMeta: React.CSSProperties = {
  color: '#52525b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 4px',
}

const itemDivider: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '16px 0',
}

const sectionLabel: React.CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
  textTransform: 'uppercase',
}

const itemRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '6px',
}

const itemName: React.CSSProperties = {
  color: '#27272a',
  flex: 1,
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
}

const itemPrice: React.CSSProperties = {
  color: '#27272a',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: '20px',
  margin: 0,
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const totalRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '4px',
}

const totalLabel: React.CSSProperties = {
  color: '#18181b',
  fontSize: '16px',
  fontWeight: 700,
  margin: 0,
}

const totalAmount: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  margin: 0,
}

const footnote: React.CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0 0',
}
