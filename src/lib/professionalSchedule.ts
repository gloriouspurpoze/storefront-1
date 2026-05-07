import type {
  Professional,
  ProfessionalCalendarSlot,
  ProfessionalWeekdayKey,
  ProfessionalWeeklyAvailability,
} from '../types/professional.types'

export const PROFESSIONAL_WEEKDAY_KEYS: readonly ProfessionalWeekdayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

const SHORT_DAY: Record<ProfessionalWeekdayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

function emptyWeek(): ProfessionalWeeklyAvailability {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
}

export function normalizeWeeklyAvailability(raw: unknown): ProfessionalWeeklyAvailability {
  const out = emptyWeek()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const src = raw as Record<string, unknown>
  for (const k of PROFESSIONAL_WEEKDAY_KEYS) {
    const arr = src[k]
    if (!Array.isArray(arr)) continue
    out[k] = arr
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((x) => ({
        start: String(x.start ?? x.from ?? '09:00'),
        end: String(x.end ?? x.to ?? '18:00'),
      }))
  }
  return out
}

/** Returns normalized week only when at least one day has slots */
export function normalizeWeeklyAvailabilityFromApi(raw: unknown): ProfessionalWeeklyAvailability | undefined {
  const w = normalizeWeeklyAvailability(raw)
  const has = PROFESSIONAL_WEEKDAY_KEYS.some((k) => w[k].length > 0)
  return has ? w : undefined
}

export function weeklyScheduleSummaryLines(weekly: ProfessionalWeeklyAvailability): string[] {
  return PROFESSIONAL_WEEKDAY_KEYS.map((k) => {
    const slots = weekly[k]
    if (!slots.length) return null
    const parts = slots.map((s) => `${s.start}–${s.end}`)
    return `${SHORT_DAY[k]}: ${parts.join(', ')}`
  }).filter((x): x is string => Boolean(x))
}

export function scheduleSummaryLines(pro: Pick<Professional, 'weeklyAvailability' | 'workingDays' | 'workingHours'>): string[] {
  const weekly = normalizeWeeklyAvailability(pro.weeklyAvailability)
  const lines = weeklyScheduleSummaryLines(weekly)
  if (lines.length > 0) return lines
  const wd = (pro.workingDays || [])
    .map((d) => String(d).toLowerCase())
    .filter((d) => PROFESSIONAL_WEEKDAY_KEYS.includes(d as ProfessionalWeekdayKey))
    .map((d) => SHORT_DAY[d as ProfessionalWeekdayKey])
    .join(', ')
  const band =
    pro.workingHours?.start && pro.workingHours?.end
      ? `${pro.workingHours.start}–${pro.workingHours.end}`
      : null
  if (wd && band) return [`${wd} · ${band}`]
  if (wd) return [wd]
  if (band) return [band]
  return []
}

const JS_DAY_TO_KEY: Record<number, ProfessionalWeekdayKey> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

/** Whether the booking's local calendar day looks covered by weekly slots or legacy workingDays */
export function bookingScheduledDayHint(
  scheduledIso: string | undefined,
  pro: Pick<Professional, 'weeklyAvailability' | 'workingDays'>,
): 'open' | 'closed' | 'unknown' {
  if (!scheduledIso?.trim()) return 'unknown'
  const d = new Date(scheduledIso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  const key = JS_DAY_TO_KEY[d.getDay()]
  const weekly = normalizeWeeklyAvailability(pro.weeklyAvailability)
  if (weekly[key].length > 0) return 'open'
  const wd = new Set((pro.workingDays || []).map((x) => String(x).toLowerCase()))
  if (wd.has(key)) return 'open'
  const anyWeekly = PROFESSIONAL_WEEKDAY_KEYS.some((k) => weekly[k].length > 0)
  if (!anyWeekly && wd.size === 0) return 'unknown'
  return 'closed'
}

export function formatSlotList(slots: ProfessionalCalendarSlot[]): string {
  if (!slots.length) return 'Off'
  return slots.map((s) => `${s.start}–${s.end}`).join(', ')
}

export function weekdayShortLabel(day: ProfessionalWeekdayKey): string {
  return SHORT_DAY[day]
}
