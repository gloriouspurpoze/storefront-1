'use client'

import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import { useEffect, useMemo, useState } from 'react'
import {
  getDeliveryDateOptions,
  getDeliveryTimeSlots,
  ORDERING_DAY_KEYS,
  type OrderingAvailabilityConfig,
  type OrderingHoursConfig,
} from '@/lib/orderingHours'

const ALWAYS_OPEN_HOURS = Object.fromEntries(
  ORDERING_DAY_KEYS.map((day) => [day, { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' }]),
) as OrderingHoursConfig

export function DeliveryDetailsSection({
  showPreferredDate,
  showPreferredTime = false,
  showAddressFields = true,
  value,
  onChange,
  variant = 'card',
  orderingHours,
  orderingAvailability,
}: {
  showPreferredDate: boolean
  showPreferredTime?: boolean
  showAddressFields?: boolean
  value: DeliveryDetailsValue
  onChange: (next: DeliveryDetailsValue) => void
  variant?: 'card' | 'plain' | 'menufast'
  orderingHours?: OrderingHoursConfig
  orderingAvailability?: OrderingAvailabilityConfig | null
}) {
  const set = (patch: Partial<DeliveryDetailsValue>) => onChange({ ...value, ...patch })

  // Re-evaluated every minute so prep time / same-day cutoff stay current.
  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    if (!showPreferredDate && !showPreferredTime) return
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [showPreferredDate, showPreferredTime])

  // No schedule passed (e.g. marketplace) → every day open; DEFAULT_ORDERING_HOURS closes Mondays.
  const hours = useMemo(() => orderingHours ?? ALWAYS_OPEN_HOURS, [orderingHours])
  // Every upcoming day is listed; closed / holiday / past-cutoff / full days are disabled.
  const dateOptions = useMemo(
    () =>
      showPreferredDate
        ? getDeliveryDateOptions(hours, orderingAvailability, new Date(nowTick), {
            requireTimeSlot: showPreferredTime,
            days: 14,
          })
        : [],
    [showPreferredDate, showPreferredTime, hours, orderingAvailability, nowTick],
  )
  const timeSlots = useMemo(
    () =>
      showPreferredTime && value.preferredDate
        ? getDeliveryTimeSlots(hours, value.preferredDate, new Date(nowTick), orderingAvailability)
        : [],
    [showPreferredTime, value.preferredDate, hours, orderingAvailability, nowTick],
  )

  // Drop a pick that stopped being bookable (e.g. the clock passed the cutoff).
  const { preferredDate, preferredTime } = value
  useEffect(() => {
    if (preferredDate && showPreferredDate && !dateOptions.some((d) => d.dateStr === preferredDate && d.available)) {
      onChange({ ...value, preferredDate: undefined, preferredTime: undefined })
    } else if (preferredTime && showPreferredTime && preferredDate && !timeSlots.some((s) => s.value === preferredTime && s.available)) {
      onChange({ ...value, preferredTime: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredDate, preferredTime, dateOptions, timeSlots])

  const isMenufast = variant === 'menufast'

  const fieldStyle: React.CSSProperties = isMenufast
    ? {}
    : variant === 'plain'
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

  const fieldClass = isMenufast ? 'mf-cards-checkout-field' : undefined

  const wrapperStyle: React.CSSProperties = isMenufast
    ? {}
    : variant === 'card'
      ? {
          background: 'white',
          border: '1px solid rgba(26,23,20,0.1)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
        }
      : { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }

  const labelStyle: React.CSSProperties = isMenufast
    ? {}
    : {
        fontSize: variant === 'card' ? '11px' : '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#8A847C',
        marginBottom: variant === 'card' ? '8px' : '4px',
      }

  if (!showAddressFields && !showPreferredDate && !showPreferredTime) return null

  const fieldInputProps = (extraStyle?: React.CSSProperties) =>
    isMenufast
      ? { className: fieldClass, style: extraStyle }
      : { style: { ...fieldStyle, ...extraStyle } }

  return (
    <div className={isMenufast ? 'mf-cards-checkout-delivery' : undefined} style={isMenufast ? undefined : wrapperStyle}>
      <div className={isMenufast ? 'mf-cards-checkout-label' : undefined} style={isMenufast ? undefined : labelStyle}>
        Delivery details
      </div>
      {showAddressFields && (
        <>
          <div className={isMenufast ? 'mf-cards-checkout-row' : undefined} style={isMenufast ? undefined : { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Flat / House no."
              value={value.addressLine1 ?? ''}
              onChange={(e) => set({ addressLine1: e.target.value })}
              {...fieldInputProps(isMenufast ? undefined : { flex: '1 1 120px' })}
              autoComplete="address-line1"
              required
            />
            <input
              type="text"
              placeholder="Building / Street"
              value={value.addressLine2 ?? ''}
              onChange={(e) => set({ addressLine2: e.target.value })}
              {...fieldInputProps(isMenufast ? undefined : { flex: '1 1 120px' })}
              autoComplete="address-line2"
            />
          </div>
          <div
            className={isMenufast ? 'mf-cards-checkout-row' : undefined}
            style={
              isMenufast
                ? undefined
                : {
                    display: 'flex',
                    gap: '8px',
                    marginBottom: showPreferredDate ? '8px' : 0,
                    flexWrap: 'wrap',
                  }
            }
          >
            <input
              type="text"
              placeholder="City"
              value={value.city ?? ''}
              onChange={(e) => set({ city: e.target.value })}
              {...fieldInputProps(isMenufast ? undefined : { flex: '1 1 120px' })}
              autoComplete="address-level2"
              required
            />
            <input
              type="text"
              placeholder="State"
              value={value.state ?? ''}
              onChange={(e) => set({ state: e.target.value })}
              {...fieldInputProps(isMenufast ? undefined : { flex: '1 1 120px' })}
              autoComplete="address-level1"
              required
            />
            <input
              type="text"
              placeholder="PIN"
              maxLength={6}
              value={value.pincode ?? ''}
              onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              {...(isMenufast
                ? { className: 'mf-cards-checkout-field mf-cards-checkout-field--pin' }
                : fieldInputProps({ flex: '0 0 88px' }))}
              autoComplete="postal-code"
              required
              inputMode="numeric"
            />
          </div>
        </>
      )}
      {showPreferredDate && (
        <label className={isMenufast ? 'mf-cards-checkout-field-label' : undefined} style={isMenufast ? undefined : { display: 'block' }}>
          <span className={isMenufast ? 'mf-cards-checkout-sublabel' : undefined} style={isMenufast ? undefined : { display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A4540', marginBottom: '4px' }}>
            Preferred date of delivery
          </span>
          <select
            value={value.preferredDate ?? ''}
            onChange={(e) => set({ preferredDate: e.target.value || undefined, preferredTime: undefined })}
            {...fieldInputProps()}
          >
            <option value="" disabled>
              Select date
            </option>
            {dateOptions.map((d) => (
              <option key={d.dateStr} value={d.dateStr} disabled={!d.available}>
                {d.available ? d.label : `${d.label} · ${d.note}`}
              </option>
            ))}
          </select>
        </label>
      )}
      {showPreferredTime && (
        <label
          className={isMenufast ? 'mf-cards-checkout-field-label' : undefined}
          style={isMenufast ? undefined : { display: 'block', marginTop: showPreferredDate ? '8px' : 0 }}
        >
          <span className={isMenufast ? 'mf-cards-checkout-sublabel' : undefined} style={isMenufast ? undefined : { display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A4540', marginBottom: '4px' }}>
            Preferred time of delivery
          </span>
          <select
            value={value.preferredTime ?? ''}
            onChange={(e) => set({ preferredTime: e.target.value || undefined })}
            {...fieldInputProps()}
            disabled={(showPreferredDate && !value.preferredDate) || !timeSlots.some((s) => s.available)}
          >
            <option value="" disabled>
              {showPreferredDate && !value.preferredDate
                ? 'Pick a date first'
                : !timeSlots.some((s) => s.available)
                  ? 'No slots left on this day'
                  : 'Select time'}
            </option>
            {timeSlots.map((s) => (
              <option key={s.value} value={s.value} disabled={!s.available}>
                {s.tag ? `${s.label} · ${s.tag}` : s.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
