export const ORDERING_DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type OrderingDayKey = (typeof ORDERING_DAY_KEYS)[number]

export interface DayOrderingHours {
  closed: boolean
  openTime?: string
  closeTime?: string
}

export type OrderingHoursConfig = Record<OrderingDayKey, DayOrderingHours>

export const ORDERING_DAY_LABELS: Record<OrderingDayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export const DEFAULT_ORDERING_HOURS: OrderingHoursConfig = {
  monday: { closed: true },
  tuesday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
  wednesday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
  thursday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
  friday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
  saturday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
  sunday: { closed: false, openTime: '12:00 AM', closeTime: '11:59 PM' },
}

export function normalizeOrderingHours(
  raw?: Partial<OrderingHoursConfig> | null,
): OrderingHoursConfig {
  const merged = { ...DEFAULT_ORDERING_HOURS }
  if (!raw) return merged

  for (const day of ORDERING_DAY_KEYS) {
    const entry = raw[day]
    if (!entry) continue
    merged[day] = {
      closed: Boolean(entry.closed),
      openTime: entry.openTime?.trim() || DEFAULT_ORDERING_HOURS[day].openTime,
      closeTime: entry.closeTime?.trim() || DEFAULT_ORDERING_HOURS[day].closeTime,
    }
  }
  return merged
}
