'use client'

import { useState } from 'react'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { formatDeliveryNotes, type DeliveryDetailsValue } from '@/lib/templateSettings'
import type { ThemeTenant } from './types'

export function MenuOrderCheckoutBlock({
  tenant,
  lines,
  notes,
  showPreferredDate = false,
  showDeliveryDetails = true,
  onSuccess,
  onClear,
  primaryLabel = 'Pay & place order',
  className,
}: {
  tenant: ThemeTenant
  lines: Array<{ productId: string; quantity: number }>
  notes?: string
  showPreferredDate?: boolean
  showDeliveryDetails?: boolean
  onSuccess: (orderNumber: string) => void
  onClear: () => void
  primaryLabel?: string
  className?: string
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const disabled = loading || lines.length === 0

  const onPay = async () => {
    if (disabled) return
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email.')
      return
    }
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const orderNotes = showDeliveryDetails
        ? formatDeliveryNotes(deliveryDetails, notes)
        : notes
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines,
        customer: { email: trimmedEmail, name: trimmedName, phone: phone.trim() || undefined },
        notes: orderNotes,
      })
      onClear()
      onSuccess(result.orderNumber)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (lines.length === 0) return null

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {showDeliveryDetails && (
        <DeliveryDetailsSection
          showPreferredDate={showPreferredDate}
          value={deliveryDetails}
          onChange={setDeliveryDetails}
          variant="plain"
        />
      )}
      <input
        type="email"
        placeholder="Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={fieldStyle}
        autoComplete="email"
      />
      <input
        type="text"
        placeholder="Full name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={fieldStyle}
        autoComplete="name"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={fieldStyle}
        autoComplete="tel"
      />
      {error && <p style={{ fontSize: '12px', color: '#c62828', margin: 0 }}>{error}</p>}
      <button type="button" onClick={() => void onPay()} disabled={disabled} style={payBtnStyle}>
        {loading ? 'Processing…' : primaryLabel}
      </button>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(26,23,20,0.15)',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'inherit',
}

const payBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '10px',
  background: '#C4633A',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
