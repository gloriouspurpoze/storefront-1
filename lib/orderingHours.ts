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

export interface OrderingClosedDate {
  /** YYYY-MM-DD (store timezone). */
  date: string
  label?: string
}

export interface OrderingAvailabilityConfig {
  earliestDate?: string
  latestDate?: string
  slotsNote?: string
  /** Hard stop on new orders (incl. scheduled) until resumed or `pausedUntil` passes. */
  paused?: boolean
  /** ISO datetime; pause lifts automatically after this. Unset = until resumed. */
  pausedUntil?: string
  /** Shown to customers while paused. */
  pausedMessage?: string
  /** Holidays / one-off closures on top of the weekly schedule. */
  closedDates?: OrderingClosedDate[]
  /** Minimum minutes between placing an order and the earliest delivery slot. */
  leadTimeMinutes?: number
  /** Rolling booking window: customers can schedule at most this many days ahead. */
  maxDaysAhead?: number
  /**
   * After this clock time (Asia/Kolkata), same-day dates are refused.
   * Example: "2:00 PM".
   */
  sameDayCutoffTime?: string
}

export type StoreClosedReason = 'paused' | 'holiday' | 'closed_today' | 'outside_hours'

export interface StoreStatus {
  isOpen: boolean
  reason?: StoreClosedReason
  /** Customer-facing explanation when closed. */
  message?: string
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function positiveInt(v: unknown, max: number): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.min(Math.floor(n), max)
}

export function getOrderingAvailabilityFromConfig(
  config: StorefrontConfig | null | undefined,
): OrderingAvailabilityConfig {
  const raw = config?.orderingAvailability
  if (!raw) return {}
  const closedDates = Array.isArray(raw.closedDates)
    ? raw.closedDates
        .filter((d) => d && typeof d.date === 'string' && DATE_RE.test(d.date))
        .map((d) => ({ date: d.date, label: d.label?.trim() || undefined }))
    : undefined
  return {
    earliestDate: raw.earliestDate?.trim() || undefined,
    latestDate: raw.latestDate?.trim() || undefined,
    slotsNote: raw.slotsNote?.trim() || undefined,
    paused: raw.paused === true,
    pausedUntil: raw.pausedUntil?.trim() || undefined,
    pausedMessage: raw.pausedMessage?.trim() || undefined,
    closedDates: closedDates?.length ? closedDates : undefined,
    leadTimeMinutes: positiveInt(raw.leadTimeMinutes, 7 * 24 * 60),
    maxDaysAhead: positiveInt(raw.maxDaysAhead, 365),
    sameDayCutoffTime: raw.sameDayCutoffTime?.trim() || undefined,
  }
}

/** Paused right now? A pause with a past `pausedUntil` has lifted on its own. */
export function isOrderingPaused(
  availability?: OrderingAvailabilityConfig | null,
  now = new Date(),
): boolean {
  if (!availability?.paused) return false
  if (!availability.pausedUntil) return true
  const until = Date.parse(availability.pausedUntil)
  return Number.isNaN(until) || until > now.getTime()
}

export function getClosedDate(
  availability: OrderingAvailabilityConfig | null | undefined,
  dateStr: string,
): OrderingClosedDate | undefined {
  return availability?.closedDates?.find((d) => d.date === dateStr)
}

/** Last schedulable day: the tighter of `latestDate` and today + `maxDaysAhead`. */
export function getLatestDeliveryDate(
  availability?: OrderingAvailabilityConfig | null,
  now = new Date(),
): string | undefined {
  const rolling = availability?.maxDaysAhead
    ? addDaysToDateStr(getISTDateParts(now).dateStr, availability.maxDaysAhead)
    : undefined
  const fixed = availability?.latestDate
  if (rolling && fixed) return rolling < fixed ? rolling : fixed
  return rolling ?? fixed
}

/** Earliest moment a new order can be fulfilled (now + lead time), as IST date + minutes. */
function earliestFulfilment(
  availability: OrderingAvailabilityConfig | null | undefined,
  now: Date,
): { dateStr: string; minutes: number } {
  const lead = availability?.leadTimeMinutes ?? 0
  const afterLead = new Date(now.getTime() + lead * 60_000)
  let ist = getISTDateParts(afterLead)

  // Past same-day cutoff → earliest calendar day is tomorrow (IST).
  const cutoff = parseOrderingTime12h(availability?.sameDayCutoffTime)
  if (cutoff !== null) {
    const nowIst = getISTDateParts(now)
    if (nowIst.hour * 60 + nowIst.minute >= cutoff) {
      const tomorrow = addDaysToDateStr(nowIst.dateStr, 1)
      if (ist.dateStr < tomorrow) {
        return { dateStr: tomorrow, minutes: 0 }
      }
    }
  }

  return { dateStr: ist.dateStr, minutes: ist.hour * 60 + ist.minute + 1 }
}

function clampDateToAvailabilityWindow(
  dateStr: string,
  availability?: OrderingAvailabilityConfig | null,
  now = new Date(),
): DeliverySlotValidation {
  if (availability?.earliestDate && dateStr < availability.earliestDate) {
    return {
      ok: false,
      message: 'That date is before our earliest available delivery day.',
    }
  }
  const latest = getLatestDeliveryDate(availability, now)
  if (latest && dateStr > latest) {
    return {
      ok: false,
      message: availability?.maxDaysAhead
        ? `We take orders up to ${availability.maxDaysAhead} day${availability.maxDaysAhead === 1 ? '' : 's'} ahead. Pick an earlier date.`
        : 'That date is after our last available delivery day.',
    }
  }
  const closed = getClosedDate(availability, dateStr)
  if (closed) {
    return {
      ok: false,
      message: closed.label
        ? `We're closed on that day (${closed.label}). Pick another date.`
        : "We're closed on that day. Pick another date.",
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
  availability?: OrderingAvailabilityConfig | null,
): { min: string; max: string } | null {
  const day = getDayOrderingHours(hours, dateStr)
  if (day.closed || getClosedDate(availability, dateStr)) return null

  const openMinutes = parseOrderingTime12h(day.openTime)
  const closeMinutes = parseOrderingTime12h(day.closeTime)
  if (openMinutes === null || closeMinutes === null) return null

  // Slots start no earlier than now + lead time (prep / dispatch buffer).
  const earliest = earliestFulfilment(availability, now)
  if (dateStr < earliest.dateStr) return null
  let minMinutes = openMinutes
  if (dateStr === earliest.dateStr) minMinutes = Math.max(minMinutes, earliest.minutes)

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
  let cursor = earliestFulfilment(availability, now).dateStr
  if (availability?.earliestDate && cursor < availability.earliestDate) {
    cursor = availability.earliestDate
  }
  const latest = getLatestDeliveryDate(availability, now)
  const maxLookahead = 366

  for (let i = 0; i < maxLookahead; i += 1) {
    if (latest && cursor > latest) {
      break
    }
    if (isOrderingDayClosed(hours, cursor) || getClosedDate(availability, cursor)) {
      cursor = addDaysToDateStr(cursor, 1)
      continue
    }

    if (requireTimeSlot) {
      const bounds = getDeliveryTimeBounds(hours, cursor, now, availability)
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

  if (isOrderingPaused(availability, now)) {
    return { ok: false, message: getPausedMessage(availability) }
  }

  const windowCheck = clampDateToAvailabilityWindow(dateStr, availability, now)
  if (!windowCheck.ok) return windowCheck

  const cutoff = parseOrderingTime12h(availability?.sameDayCutoffTime)
  if (cutoff !== null) {
    const ist = getISTDateParts(now)
    if (dateStr === ist.dateStr && ist.hour * 60 + ist.minute >= cutoff) {
      return {
        ok: false,
        message: `Same-day orders close at ${availability?.sameDayCutoffTime?.trim() || '2:00 PM'}. Please choose tomorrow or a later date.`,
      }
    }
  }

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

  const bounds = getDeliveryTimeBounds(hours, dateStr, now, availability)
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

export function getPausedMessage(availability?: OrderingAvailabilityConfig | null): string {
  return availability?.pausedMessage || "We're not taking new orders right now. Please check back soon."
}

/** Open/closed right now, with the reason so the storefront can explain it. */
export function getStoreStatus(
  hours: OrderingHoursConfig,
  availability?: OrderingAvailabilityConfig | null,
  date = new Date(),
): StoreStatus {
  if (isOrderingPaused(availability, date)) {
    return { isOpen: false, reason: 'paused', message: getPausedMessage(availability) }
  }
  const ist = getISTDateParts(date)
  const holiday = getClosedDate(availability, ist.dateStr)
  if (holiday) {
    return {
      isOpen: false,
      reason: 'holiday',
      message: holiday.label ? `Closed today · ${holiday.label}` : 'Closed today',
    }
  }
  // Weekday in the store timezone, not the viewer's.
  const today = hours[getOrderingDayKeyForDate(ist.dateStr)]
  if (today.closed) return { isOpen: false, reason: 'closed_today', message: 'Closed today' }

  const openMinutes = parseOrderingTime12h(today.openTime)
  const closeMinutes = parseOrderingTime12h(today.closeTime)
  if (openMinutes === null || closeMinutes === null) return { isOpen: true }

  const nowMinutes = ist.hour * 60 + ist.minute
  if (nowMinutes >= openMinutes && nowMinutes <= closeMinutes) return { isOpen: true }
  return { isOpen: false, reason: 'outside_hours', message: `Closed · ${formatDayOrderingHours(today)}` }
}

/**
 * One-line status for headers/badges. Pause and holiday messages win; the slots note
 * only replaces the hours while open (it used to hide "Closed").
 */
export function getStoreStatusText(
  hours: OrderingHoursConfig,
  availability?: OrderingAvailabilityConfig | null,
  date = new Date(),
): { isOpen: boolean; text: string } {
  const status = getStoreStatus(hours, availability, date)
  if (status.reason === 'paused' || status.reason === 'holiday' || status.reason === 'closed_today') {
    return { isOpen: false, text: status.message ?? 'Closed' }
  }
  const hoursLabel = getTodayOrderingLabel(hours, date)
  if (status.isOpen) return { isOpen: true, text: availability?.slotsNote || `Open · ${hoursLabel}` }
  return { isOpen: false, text: `Closed · ${hoursLabel}` }
}

export function isStoreOpenNow(
  hours: OrderingHoursConfig,
  date = new Date(),
  availability?: OrderingAvailabilityConfig | null,
): boolean {
  return getStoreStatus(hours, availability, date).isOpen
}

export function getTodayOrderingLabel(hours: OrderingHoursConfig, date = new Date()): string {
  const today = hours[getOrderingDayKeyForDate(getISTDateParts(date).dateStr)]
  return formatDayOrderingHours(today)
}

export type DeliveryDateUnavailableReason = 'closed' | 'holiday' | 'cutoff' | 'no_slots'

export interface DeliveryDateOption {
  /** YYYY-MM-DD (IST). */
  dateStr: string
  /** e.g. "Wed, 8 Oct". */
  label: string
  available: boolean
  reason?: DeliveryDateUnavailableReason
  /** Customer-facing reason when unavailable. */
  note?: string
}

const DATE_OPTION_FORMAT = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function formatDateOptionLabel(dateStr: string): string {
  return DATE_OPTION_FORMAT.format(new Date(`${dateStr}T00:00:00Z`))
}

/**
 * Upcoming dates for a delivery-date dropdown: today (IST) through the booking window,
 * with every unavailable day kept but flagged so pickers can show it disabled.
 */
export function getDeliveryDateOptions(
  hours: OrderingHoursConfig,
  availability?: OrderingAvailabilityConfig | null,
  now = new Date(),
  opts: { requireTimeSlot?: boolean; days?: number } = {},
): DeliveryDateOption[] {
  const today = getISTDateParts(now).dateStr
  const latest = getLatestDeliveryDate(availability, now)
  const maxDays = Math.max(1, opts.days ?? 14)
  let start = today
  if (availability?.earliestDate && start < availability.earliestDate) start = availability.earliestDate

  const cutoff = parseOrderingTime12h(availability?.sameDayCutoffTime)
  const nowIst = getISTDateParts(now)
  const pastCutoff = cutoff !== null && nowIst.hour * 60 + nowIst.minute >= cutoff
  // First calendar day reachable after prep time (and cutoff), ignoring slot fit.
  const earliestDay = earliestFulfilment(availability, now).dateStr

  const out: DeliveryDateOption[] = []
  for (let i = 0, cursor = start; i < maxDays; i += 1, cursor = addDaysToDateStr(cursor, 1)) {
    if (latest && cursor > latest) break
    const option: DeliveryDateOption = { dateStr: cursor, label: formatDateOptionLabel(cursor), available: true }
    const holiday = getClosedDate(availability, cursor)
    if (holiday) {
      Object.assign(option, { available: false, reason: 'holiday', note: holiday.label || 'Holiday' })
    } else if (isOrderingDayClosed(hours, cursor)) {
      Object.assign(option, { available: false, reason: 'closed', note: 'Closed' })
    } else if (cursor === today && pastCutoff) {
      Object.assign(option, { available: false, reason: 'cutoff', note: 'Same-day orders closed' })
    } else if (
      opts.requireTimeSlot !== false &&
      !getDeliveryTimeSlots(hours, cursor, now, availability).some((s) => s.available)
    ) {
      Object.assign(option, { available: false, reason: 'no_slots', note: 'No slots left' })
    } else if (cursor < earliestDay) {
      Object.assign(option, { available: false, reason: 'no_slots', note: 'No slots left' })
    }
    out.push(option)
  }
  return out
}

export type DeliveryTimeSlotUnavailableReason = 'preparing' | 'unavailable'

export interface DeliveryTimeSlot {
  /** HH:MM (24h) slot start — the value sent with the order. */
  value: string
  /** Slot window, e.g. "2:30 PM – 3:00 PM". */
  label: string
  available: boolean
  reason?: DeliveryTimeSlotUnavailableReason
  /** Customer-facing tag: "Earliest" on the first bookable slot, "Preparing" inside the prep window. */
  tag?: string
}

export function formatTimeSlotLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(minutes % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`
}

/** "11:00 – 11:30 AM" when both ends share AM/PM, else "11:30 AM – 12:00 PM". */
export function formatTimeWindowLabel(start: number, end: number): string {
  const a = formatTimeSlotLabel(start)
  const b = formatTimeSlotLabel(end)
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`
}

/**
 * The day's delivery windows (every `stepMinutes` within opening hours). Windows already
 * past are omitted; windows inside the preparation time (or blocked by the same-day cutoff)
 * are kept but unavailable so customers see why. The first bookable window is tagged.
 */
export function getDeliveryTimeSlots(
  hours: OrderingHoursConfig,
  dateStr: string,
  now = new Date(),
  availability?: OrderingAvailabilityConfig | null,
  stepMinutes = 30,
): DeliveryTimeSlot[] {
  if (!dateStr) return []
  const day = getDayOrderingHours(hours, dateStr)
  if (day.closed || getClosedDate(availability, dateStr)) return []
  const open = parseOrderingTime12h(day.openTime)
  const close = parseOrderingTime12h(day.closeTime)
  if (open === null || close === null || close <= open) return []

  const step = Math.max(5, Math.floor(stepMinutes))
  const nowIst = getISTDateParts(now)
  const today = nowIst.dateStr
  if (dateStr < today) return []
  const nowMinutes = dateStr === today ? nowIst.hour * 60 + nowIst.minute : -1

  // First bookable minute (prep time / cutoff applied); null = nothing bookable that day.
  const bounds = getDeliveryTimeBounds(hours, dateStr, now, availability)
  const firstBookable = bounds ? parseTimeInputValue(bounds.min) : null
  const cutoff = parseOrderingTime12h(availability?.sameDayCutoffTime)
  const sameDayClosed = dateStr === today && cutoff !== null && nowMinutes >= cutoff

  const slots: DeliveryTimeSlot[] = []
  let earliestTagged = false
  for (let m = Math.ceil(open / step) * step; m < close; m += step) {
    if (m < nowMinutes) continue // already past
    const end = Math.min(m + step, close)
    // A closing time off the grid (e.g. 3:03 PM) would leave a stub window — skip it.
    if (end - m < step / 2) continue
    const slot: DeliveryTimeSlot = {
      value: minutesToTimeInputValue(m),
      label: formatTimeWindowLabel(m, end),
      available: firstBookable !== null && m >= firstBookable,
    }
    if (!slot.available) {
      slot.reason = sameDayClosed ? 'unavailable' : 'preparing'
      slot.tag = sameDayClosed ? 'Same-day closed' : 'Preparing'
    } else if (!earliestTagged) {
      slot.tag = 'Earliest'
      earliestTagged = true
    }
    slots.push(slot)
  }
  return slots
}

/** First bookable date + window, e.g. for "Earliest available: Today, 2:30 PM". */
export function getEarliestDeliverySlot(
  hours: OrderingHoursConfig,
  availability?: OrderingAvailabilityConfig | null,
  now = new Date(),
  stepMinutes = 30,
): { dateStr: string; dayLabel: string; slot: DeliveryTimeSlot; label: string } | null {
  const today = getISTDateParts(now).dateStr
  for (const option of getDeliveryDateOptions(hours, availability, now, { days: 30 })) {
    if (!option.available) continue
    const slot = getDeliveryTimeSlots(hours, option.dateStr, now, availability, stepMinutes).find((s) => s.available)
    if (!slot) continue
    const dayLabel =
      option.dateStr === today ? 'Today' : option.dateStr === addDaysToDateStr(today, 1) ? 'Tomorrow' : option.label
    return { dateStr: option.dateStr, dayLabel, slot, label: `${dayLabel}, ${formatTimeSlotLabel(parseTimeInputValue(slot.value) ?? 0)}` }
  }
  return null
}
