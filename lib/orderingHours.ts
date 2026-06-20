import type { StorefrontConfig } from '@/lib/storefront-api'



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

export interface OrderingAvailabilityConfig {
  earliestDate?: string
  latestDate?: string
  slotsNote?: string
}



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



export const STORE_TIMEZONE = 'Asia/Kolkata'



const ORDERING_DAY_BY_JS_INDEX: OrderingDayKey[] = [

  'sunday',

  'monday',

  'tuesday',

  'wednesday',

  'thursday',

  'friday',

  'saturday',

]



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



export function getOrderingHoursFromConfig(

  config: StorefrontConfig | null | undefined,

): OrderingHoursConfig {

  return normalizeOrderingHours(config?.orderingHours)

}

export function getOrderingAvailabilityFromConfig(

  config: StorefrontConfig | null | undefined,

): OrderingAvailabilityConfig {

  const raw = config?.orderingAvailability

  if (!raw) return {}

  return {

    earliestDate: raw.earliestDate?.trim() || undefined,

    latestDate: raw.latestDate?.trim() || undefined,

    slotsNote: raw.slotsNote?.trim() || undefined,

  }

}

function clampDateToAvailabilityWindow(

  dateStr: string,

  availability?: OrderingAvailabilityConfig | null,

): DeliverySlotValidation {

  if (availability?.earliestDate && dateStr < availability.earliestDate) {

    return {

      ok: false,

      message: 'That date is before our earliest available delivery day.',

    }

  }

  if (availability?.latestDate && dateStr > availability.latestDate) {

    return {

      ok: false,

      message: 'That date is after our last available delivery day.',

    }

  }

  return { ok: true }

}



export function formatDayOrderingHours(day: DayOrderingHours): string {

  if (day.closed) return 'CLOSED'

  const open = day.openTime?.trim()

  const close = day.closeTime?.trim()

  if (open && close) return `${open} - ${close}`

  if (open) return open

  if (close) return close

  return 'CLOSED'

}



export function getCurrentOrderingDayKey(date = new Date()): OrderingDayKey {

  return ORDERING_DAY_BY_JS_INDEX[date.getDay()] ?? 'monday'

}



export function getOrderingDayKeyForDate(dateStr: string): OrderingDayKey {

  const [y, m, d] = dateStr.split('-').map(Number)

  const date = new Date(y, (m ?? 1) - 1, d ?? 1)

  return ORDERING_DAY_BY_JS_INDEX[date.getDay()] ?? 'monday'

}



export function getISTDateParts(date = new Date()): {

  dateStr: string

  hour: number

  minute: number

} {

  const parts = new Intl.DateTimeFormat('en-CA', {

    timeZone: STORE_TIMEZONE,

    year: 'numeric',

    month: '2-digit',

    day: '2-digit',

    hour: '2-digit',

    minute: '2-digit',

    hour12: false,

  })

    .formatToParts(date)

    .reduce<Record<string, string>>((acc, part) => {

      if (part.type !== 'literal') acc[part.type] = part.value

      return acc

    }, {})



  return {

    dateStr: `${parts.year}-${parts.month}-${parts.day}`,

    hour: parseInt(parts.hour ?? '0', 10),

    minute: parseInt(parts.minute ?? '0', 10),

  }

}



export function todayDateInputValue(date = new Date()): string {

  return getISTDateParts(date).dateStr

}



export function addDaysToDateStr(dateStr: string, days: number): string {

  const [y, m, d] = dateStr.split('-').map(Number)

  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)

  dt.setDate(dt.getDate() + days)

  const year = dt.getFullYear()

  const month = String(dt.getMonth() + 1).padStart(2, '0')

  const day = String(dt.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`

}



/** Parse admin 12-hour time (e.g. "2:30 PM") to minutes since midnight. */

export function parseOrderingTime12h(time?: string): number | null {

  const raw = time?.trim()

  if (!raw) return null



  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (match12) {

    let hour = parseInt(match12[1], 10)

    const minute = parseInt(match12[2], 10)

    const period = match12[3].toUpperCase()

    if (hour === 12) hour = 0

    if (period === 'PM') hour += 12

    return hour * 60 + minute

  }



  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/)

  if (match24) {

    const hour = parseInt(match24[1], 10)

    const minute = parseInt(match24[2], 10)

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {

      return hour * 60 + minute

    }

  }



  return null

}



export function minutesToTimeInputValue(minutes: number): string {

  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes))

  const hour = Math.floor(clamped / 60)

  const minute = clamped % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

}



export function parseTimeInputValue(time?: string): number | null {

  if (!time?.trim()) return null

  const [hh, mm] = time.split(':').map((v) => parseInt(v, 10))

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null

  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null

  return hh * 60 + mm

}



export function isOrderingDayClosed(hours: OrderingHoursConfig, dateStr: string): boolean {

  return Boolean(hours[getOrderingDayKeyForDate(dateStr)]?.closed)

}



export function getDayOrderingHours(

  hours: OrderingHoursConfig,

  dateStr: string,

): DayOrderingHours {

  return hours[getOrderingDayKeyForDate(dateStr)]

}



export function getDeliveryTimeBounds(

  hours: OrderingHoursConfig,

  dateStr: string,

  now = new Date(),

): { min: string; max: string } | null {

  const day = getDayOrderingHours(hours, dateStr)

  if (day.closed) return null



  const openMinutes = parseOrderingTime12h(day.openTime)

  const closeMinutes = parseOrderingTime12h(day.closeTime)

  if (openMinutes === null || closeMinutes === null) return null



  let minMinutes = openMinutes

  const ist = getISTDateParts(now)

  if (dateStr === ist.dateStr) {

    const nowMinutes = ist.hour * 60 + ist.minute + 1

    minMinutes = Math.max(minMinutes, nowMinutes)

  }



  if (minMinutes > closeMinutes) return null



  return {

    min: minutesToTimeInputValue(minMinutes),

    max: minutesToTimeInputValue(closeMinutes),

  }

}



export function getMinDeliveryDate(

  hours: OrderingHoursConfig,

  now = new Date(),

  options?: { requireTimeSlot?: boolean; availability?: OrderingAvailabilityConfig | null },

): string {

  const requireTimeSlot = options?.requireTimeSlot ?? false

  const availability = options?.availability

  let cursor = getISTDateParts(now).dateStr

  if (availability?.earliestDate && cursor < availability.earliestDate) {

    cursor = availability.earliestDate

  }

  const maxLookahead = 366



  for (let i = 0; i < maxLookahead; i += 1) {

    if (availability?.latestDate && cursor > availability.latestDate) {

      break

    }

    if (isOrderingDayClosed(hours, cursor)) {

      cursor = addDaysToDateStr(cursor, 1)

      continue

    }



    if (requireTimeSlot) {

      const bounds = getDeliveryTimeBounds(hours, cursor, now)

      if (!bounds) {

        cursor = addDaysToDateStr(cursor, 1)

        continue

      }

    }



    return cursor

  }



  return cursor

}



export type DeliverySlotValidation =

  | { ok: true }

  | { ok: false; message: string }



export function validateDeliverySlot(

  hours: OrderingHoursConfig,

  date: string,

  time?: string,

  now = new Date(),

  availability?: OrderingAvailabilityConfig | null,

): DeliverySlotValidation {

  const dateStr = date.trim()

  if (!dateStr) {

    return { ok: false, message: 'Please choose a delivery date.' }

  }



  const windowCheck = clampDateToAvailabilityWindow(dateStr, availability)

  if (!windowCheck.ok) return windowCheck



  const minDate = getMinDeliveryDate(hours, now, {

    requireTimeSlot: Boolean(time?.trim()),

    availability,

  })

  if (dateStr < minDate) {

    return { ok: false, message: 'That date is no longer available. Pick a later date.' }

  }



  if (isOrderingDayClosed(hours, dateStr)) {

    return { ok: false, message: 'The store is closed on that day. Pick another date.' }

  }



  if (!time?.trim()) {

    return { ok: true }

  }



  const timeMinutes = parseTimeInputValue(time)

  if (timeMinutes === null) {

    return { ok: false, message: 'Please choose a valid time.' }

  }



  const bounds = getDeliveryTimeBounds(hours, dateStr, now)

  if (!bounds) {

    return { ok: false, message: 'No delivery slots are available on that day.' }

  }



  const minMinutes = parseTimeInputValue(bounds.min)

  const maxMinutes = parseTimeInputValue(bounds.max)

  if (minMinutes === null || maxMinutes === null) {

    return { ok: false, message: 'Delivery hours are not configured for that day.' }

  }



  if (timeMinutes < minMinutes || timeMinutes > maxMinutes) {

    return {

      ok: false,

      message: `Choose a time between ${bounds.min} and ${bounds.max}.`,

    }

  }



  return { ok: true }

}



export function isStoreOpenNow(

  hours: OrderingHoursConfig,

  date = new Date(),

): boolean {

  const today = hours[getCurrentOrderingDayKey(date)]

  if (today.closed) return false



  const openMinutes = parseOrderingTime12h(today.openTime)

  const closeMinutes = parseOrderingTime12h(today.closeTime)

  if (openMinutes === null || closeMinutes === null) return true



  const ist = getISTDateParts(date)

  const nowMinutes = ist.hour * 60 + ist.minute

  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes

}



export function getTodayOrderingLabel(hours: OrderingHoursConfig, date = new Date()): string {

  const today = hours[getCurrentOrderingDayKey(date)]

  return formatDayOrderingHours(today)

}


