import { describe, expect, it } from 'vitest'
import {
  getDeliveryTimeBounds,
  getMinDeliveryDate,
  getStoreStatus,
  getStoreStatusText,
  isOrderingPaused,
  normalizeOrderingHours,
  validateDeliverySlot,
  type OrderingHoursConfig,
} from '../orderingHours'

// 2026-10-07 is a Wednesday. 10:00 IST = 04:30 UTC.
const WED_10_IST = new Date('2026-10-07T04:30:00Z')
const open = { closed: false, openTime: '9:00 AM', closeTime: '9:00 PM' }
const hours: OrderingHoursConfig = normalizeOrderingHours({
  monday: open,
  tuesday: open,
  wednesday: open,
  thursday: open,
  friday: open,
  saturday: open,
  sunday: { closed: true },
})

describe('ordering availability rules', () => {
  it('pause blocks ordering until resumed, and lifts itself after pausedUntil', () => {
    expect(isOrderingPaused({ paused: true }, WED_10_IST)).toBe(true)
    expect(isOrderingPaused({ paused: true, pausedUntil: '2026-10-07T05:00:00Z' }, WED_10_IST)).toBe(true)
    expect(isOrderingPaused({ paused: true, pausedUntil: '2026-10-07T04:00:00Z' }, WED_10_IST)).toBe(false)

    const status = getStoreStatus(hours, { paused: true, pausedMessage: 'Back at 6 PM' }, WED_10_IST)
    expect(status).toEqual({ isOpen: false, reason: 'paused', message: 'Back at 6 PM' })
    expect(validateDeliverySlot(hours, '2026-10-09', undefined, WED_10_IST, { paused: true }).ok).toBe(false)
  })

  it('closed dates close the store for the day and are skipped when scheduling', () => {
    const availability = { closedDates: [{ date: '2026-10-07', label: 'Diwali' }] }
    expect(getStoreStatus(hours, availability, WED_10_IST)).toMatchObject({ isOpen: false, reason: 'holiday' })
    expect(getStoreStatusText(hours, availability, WED_10_IST).text).toBe('Closed today · Diwali')
    expect(getMinDeliveryDate(hours, WED_10_IST, { availability })).toBe('2026-10-08')
    const res = validateDeliverySlot(hours, '2026-10-07', undefined, WED_10_IST, availability)
    expect(res.ok).toBe(false)
  })

  it('lead time pushes the earliest slot later, and into the next open day', () => {
    expect(getDeliveryTimeBounds(hours, '2026-10-07', WED_10_IST, { leadTimeMinutes: 90 })?.min).toBe('11:31')
    // 10:00 + 12h = 22:00, after close → first slot is tomorrow at opening.
    const availability = { leadTimeMinutes: 12 * 60 }
    expect(getDeliveryTimeBounds(hours, '2026-10-07', WED_10_IST, availability)).toBeNull()
    expect(getMinDeliveryDate(hours, WED_10_IST, { requireTimeSlot: true, availability })).toBe('2026-10-08')
  })

  it('max days ahead caps how far out customers can schedule', () => {
    const availability = { maxDaysAhead: 3 }
    expect(validateDeliverySlot(hours, '2026-10-10', undefined, WED_10_IST, availability).ok).toBe(true)
    const res = validateDeliverySlot(hours, '2026-10-11', undefined, WED_10_IST, availability)
    expect(res).toMatchObject({ ok: false })
  })

  it('slots note no longer hides that the store is closed', () => {
    const sunday = new Date('2026-10-11T04:30:00Z')
    expect(getStoreStatusText(hours, { slotsNote: 'Slots from 11 AM' }, sunday)).toEqual({
      isOpen: false,
      text: 'Closed today',
    })
    expect(getStoreStatusText(hours, { slotsNote: 'Slots from 11 AM' }, WED_10_IST).text).toBe('Slots from 11 AM')
  })

  it('uses the store-timezone weekday, not the viewer timezone', () => {
    // 2026-10-10 23:30 UTC is already Sunday 05:00 in IST → closed.
    expect(getStoreStatus(hours, null, new Date('2026-10-10T23:30:00Z'))).toMatchObject({ reason: 'closed_today' })
  })
})
