import { describe, expect, it, vi } from 'vitest'
import { runPreCheckoutGuards } from '../checkoutGuard'
import {
  getDeliveryDateOptions,
  getDeliveryTimeSlots,
  getEarliestDeliverySlot,
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
} from '../orderingHours'
import type { StorefrontConfig } from '../storefront-api'

const open = { closed: false, openTime: '11:00 AM', closeTime: '11:59 PM' }
const config = {
  tenantId: 't1',
  branding: {},
  seo: {},
  featureFlags: {},
  orderingHours: {
    monday: open,
    tuesday: open,
    wednesday: open,
    thursday: open,
    friday: open,
    saturday: open,
    sunday: { closed: true },
  },
  orderingAvailability: { leadTimeMinutes: 120, sameDayCutoffTime: '2:00 PM' },
} as StorefrontConfig

const opts = { requireDate: true, requireTime: true, requireAddress: false }
describe('runPreCheckoutGuards scheduling (Brown Butter checkout)', () => {
  it('enforces preparation time, ordering hours and the same-day cutoff', () => {
    vi.useFakeTimers()
    try {
      // Wed 2026-10-07 12:00 IST (06:30 UTC): before cutoff, 2h prep → earliest 14:01.
      vi.setSystemTime(new Date('2026-10-07T06:30:00Z'))
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-07', preferredTime: '13:00' }, opts).ok).toBe(false)
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-07', preferredTime: '14:30' }, opts).ok).toBe(true)
      // Before opening hours on a future day.
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-08', preferredTime: '10:00' }, opts).ok).toBe(false)
      // Closed weekday (Sunday 2026-10-11).
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-11', preferredTime: '12:00' }, opts).ok).toBe(false)
      // Past date.
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-06', preferredTime: '12:00' }, opts).ok).toBe(false)

      // Wed 15:00 IST (09:30 UTC): past 2 PM cutoff → today refused, tomorrow fine.
      vi.setSystemTime(new Date('2026-10-07T09:30:00Z'))
      const today = runPreCheckoutGuards(config, { preferredDate: '2026-10-07', preferredTime: '20:00' }, opts)
      expect(today).toEqual({ ok: false, message: expect.stringContaining('Same-day orders close at 2:00 PM') })
      expect(runPreCheckoutGuards(config, { preferredDate: '2026-10-08', preferredTime: '11:00' }, opts).ok).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('delivery picker options', () => {
  const hours = getOrderingHoursFromConfig(config)
  const availability = getOrderingAvailabilityFromConfig(config)

  it('lists upcoming days with closed / past-cutoff days disabled', () => {
    // Wed 2026-10-07 15:00 IST — past the 2 PM cutoff.
    const opts = getDeliveryDateOptions(hours, availability, new Date('2026-10-07T09:30:00Z'), { days: 5 })
    expect(opts.map((o) => [o.dateStr, o.available, o.reason])).toEqual([
      ['2026-10-07', false, 'cutoff'],
      ['2026-10-08', true, undefined],
      ['2026-10-09', true, undefined],
      ['2026-10-10', true, undefined],
      ['2026-10-11', false, 'closed'],
    ])
    expect(opts[0].label).toMatch(/Wed/)
  })

  it('hides past windows, disables the prep window and tags the earliest slot', () => {
    // Wed 12:00 IST, 2h prep → 12:00–13:30 windows are "Preparing", 14:30 is the earliest bookable.
    const noon = new Date('2026-10-07T06:30:00Z')
    const slots = getDeliveryTimeSlots(hours, '2026-10-07', noon, availability)
    expect(slots[0]).toEqual({
      value: '12:00',
      label: '12:00 – 12:30 PM',
      available: false,
      reason: 'preparing',
      tag: 'Preparing',
    })
    expect(slots.filter((s) => !s.available).map((s) => s.value)).toEqual(['12:00', '12:30', '13:00', '13:30', '14:00'])
    expect(slots.find((s) => s.available)).toEqual({
      value: '14:30',
      label: '2:30 – 3:00 PM',
      available: true,
      tag: 'Earliest',
    })
    expect(slots[slots.length - 1].label).toBe('11:30 – 11:59 PM')
    expect(getDeliveryTimeSlots(hours, '2026-10-08', noon, availability).find((s) => s.value === '11:30')?.label).toBe('11:30 AM – 12:00 PM')
    // 11:00 AM window is already past → not listed.
    expect(slots.some((s) => s.value === '11:00')).toBe(false)

    // Tomorrow: every window from opening is bookable.
    const tomorrow = getDeliveryTimeSlots(hours, '2026-10-08', noon, availability)
    expect(tomorrow[0]).toMatchObject({ value: '11:00', available: true, tag: 'Earliest' })
    expect(tomorrow.every((s) => s.available)).toBe(true)
    // Off-grid close (3:03 PM) → no 3-minute stub window at the end.
    const shortDay = { ...hours, thursday: { closed: false, openTime: '11:00 AM', closeTime: '3:03 PM' } }
    expect(getDeliveryTimeSlots(shortDay, '2026-10-08', noon, availability).at(-1)?.label).toBe('2:30 – 3:00 PM')
    // Closed day → nothing.
    expect(getDeliveryTimeSlots(hours, '2026-10-11', noon, availability)).toEqual([])

    expect(getEarliestDeliverySlot(hours, availability, noon)?.label).toBe('Today, 2:30 PM')
  })

  it('after the same-day cutoff, today is blocked and the earliest slot is tomorrow', () => {
    const threePm = new Date('2026-10-07T09:30:00Z')
    const today = getDeliveryTimeSlots(hours, '2026-10-07', threePm, availability)
    expect(today.length).toBeGreaterThan(0)
    expect(today.every((s) => !s.available && s.tag === 'Same-day closed')).toBe(true)
    expect(getEarliestDeliverySlot(hours, availability, threePm)).toMatchObject({
      dateStr: '2026-10-08',
      label: 'Tomorrow, 11:00 AM',
    })
  })
})
