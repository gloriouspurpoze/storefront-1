import { Heading, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

/** Service booking add-on — customer confirmation that the request was received. */
export interface BookingConfirmationEmailProps {
  tenant: {
    brand_name: string
    brand_color: string
    logo_url?: string
    is_premium?: boolean
    contact_phone?: string
  }
  customer: { name: string }
  booking: {
    reference: string
    preferred_window: string
    address: string
    services: Array<{ name: string; qty: number }>
    message?: string
  }
}

export default function BookingConfirmation({ tenant, customer, booking }: BookingConfirmationEmailProps) {
  const accent = tenant.brand_color || '#FF5C00'
  return (
    <EmailLayout
      brandName={tenant.brand_name}
      brandColor={tenant.brand_color}
      logoUrl={tenant.logo_url}
      previewText={`Booking request ${booking.reference} received — ${booking.preferred_window}`}
      showMenufastFooter={!tenant.is_premium}
    >
      <Heading style={h1}>We&apos;ve received your booking request</Heading>
      <Text style={paragraph}>Hi {customer.name || 'there'},</Text>
      <Text style={paragraph}>
        Thanks for booking with <strong>{tenant.brand_name}</strong>. Our team will call you to confirm
        the visit time.
      </Text>

      <Section style={{ ...box, borderColor: accent }}>
        <Text style={label}>Reference</Text>
        <Text style={{ ...value, color: accent }}>{booking.reference}</Text>
        <Text style={label}>Preferred time</Text>
        <Text style={value}>{booking.preferred_window}</Text>
        <Text style={label}>Service{booking.services.length > 1 ? 's' : ''}</Text>
        {booking.services.map((s, i) => (
          <Text key={i} style={line}>
            {s.name}
            {s.qty > 1 ? ` × ${s.qty}` : ''}
          </Text>
        ))}
        <Text style={label}>Visit address</Text>
        <Text style={line}>{booking.address}</Text>
        {booking.message ? (
          <>
            <Text style={label}>Your notes</Text>
            <Text style={line}>{booking.message}</Text>
          </>
        ) : null}
      </Section>

      <Text style={footnote}>
        Your preferred slot is a request — it&apos;s confirmed once our team calls you.
        {tenant.contact_phone ? ` Need to change something? Call us on ${tenant.contact_phone}.` : ''}
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { color: '#18181b', fontSize: '22px', fontWeight: 700, lineHeight: '28px', margin: '0 0 16px' }
const paragraph: React.CSSProperties = { color: '#3f3f46', fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' }
const box: React.CSSProperties = {
  border: '2px solid',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '20px 0',
  backgroundColor: '#fafafa',
}
const label: React.CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '12px 0 2px',
}
const value: React.CSSProperties = { color: '#18181b', fontSize: '16px', fontWeight: 700, margin: '0' }
const line: React.CSSProperties = { color: '#27272a', fontSize: '14px', lineHeight: '20px', margin: '0' }
const footnote: React.CSSProperties = { color: '#71717a', fontSize: '13px', lineHeight: '20px', margin: '16px 0 0' }
