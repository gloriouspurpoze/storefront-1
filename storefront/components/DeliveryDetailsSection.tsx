'use client'

import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import { todayDateInputValue } from '@/lib/templateSettings'

export function DeliveryDetailsSection({
  showPreferredDate,
  showAddressFields = true,
  value,
  onChange,
  variant = 'card',
}: {
  showPreferredDate: boolean
  showAddressFields?: boolean
  value: DeliveryDetailsValue
  onChange: (next: DeliveryDetailsValue) => void
  variant?: 'card' | 'plain'
}) {
  const set = (patch: Partial<DeliveryDetailsValue>) => onChange({ ...value, ...patch })

  const fieldStyle: React.CSSProperties =
    variant === 'plain'
      ? {
          width: '100%',
          padding: '10px 12px',
          border: '1px solid rgba(26,23,20,0.15)',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'inherit',
        }
      : {
          padding: '8px 10px',
          border: '1px solid rgba(26,23,20,0.15)',
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: 'inherit',
          color: '#1A1714',
          outline: 'none',
          background: variant === 'card' ? '#FAF8F3' : 'white',
          width: '100%',
        }

  const wrapperStyle: React.CSSProperties =
    variant === 'card'
      ? {
          background: 'white',
          border: '1px solid rgba(26,23,20,0.1)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
        }
      : { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }

  const labelStyle: React.CSSProperties = {
    fontSize: variant === 'card' ? '11px' : '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#8A847C',
    marginBottom: variant === 'card' ? '8px' : '4px',
  }

  if (!showAddressFields && !showPreferredDate) return null

  return (
    <div style={wrapperStyle}>
      <div style={labelStyle}>Delivery details</div>
      {showAddressFields && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Flat / House no."
              value={value.addressLine1 ?? ''}
              onChange={(e) => set({ addressLine1: e.target.value })}
              style={{ ...fieldStyle, flex: '1 1 120px' }}
              autoComplete="address-line1"
            />
            <input
              type="text"
              placeholder="Building / Street"
              value={value.addressLine2 ?? ''}
              onChange={(e) => set({ addressLine2: e.target.value })}
              style={{ ...fieldStyle, flex: '1 1 120px' }}
              autoComplete="address-line2"
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: showPreferredDate ? '8px' : 0,
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="City"
              value={value.city ?? ''}
              onChange={(e) => set({ city: e.target.value })}
              style={{ ...fieldStyle, flex: '1 1 120px' }}
              autoComplete="address-level2"
            />
            <input
              type="text"
              placeholder="PIN"
              maxLength={6}
              value={value.pincode ?? ''}
              onChange={(e) => set({ pincode: e.target.value })}
              style={{ ...fieldStyle, flex: '0 0 88px' }}
              autoComplete="postal-code"
            />
          </div>
        </>
      )}
      {showPreferredDate && (
        <label style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#4A4540',
              marginBottom: '4px',
            }}
          >
            Preferred date of delivery
          </span>
          <input
            type="date"
            min={todayDateInputValue()}
            value={value.preferredDate ?? ''}
            onChange={(e) => set({ preferredDate: e.target.value })}
            style={fieldStyle}
          />
        </label>
      )}
    </div>
  )
}
