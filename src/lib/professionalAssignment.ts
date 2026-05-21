/**
 * ============================================================================
 * PROFESSIONAL ASSIGNMENT ENGINE
 * ============================================================================
 * Industry-standard scoring + matching used by both auto and manual flows.
 *
 * Flow (matches dispatch SaaS like Urban Company / Housejoy / Bizom):
 *   1. Hard-filter the fleet by eligibility (active, verified, not offline,
 *      service area, skill / category overlap, schedule day open).
 *   2. Soft-score each candidate on a weighted 0–100 scale (distance, skill /
 *      category overlap, rating, workload, recency, expertise).
 *   3. Rank, surface top candidates with breakdown, and let admin auto-assign
 *      the top match or manually pick.
 *
 * Pure functions — no API calls — keep them easy to unit test and reuse from
 * the dialog, dashboards, and any future bulk dispatcher.
 * ============================================================================
 */

import type { Professional, ProfessionalWeekdayKey } from '../types/professional.types'
import {
  bookingScheduledDayHint,
  normalizeWeeklyAvailability,
  PROFESSIONAL_WEEKDAY_KEYS,
} from './professionalSchedule'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface BookingMatchInput {
  /** Booking primary service category (e.g. "electrician"). */
  category?: string | null
  /** Required skills derived from booking line items / service request. */
  skills?: string[] | null
  /** Booking service area — used as fallback when no coordinates. */
  city?: string | null
  pincode?: string | null
  /** ISO datetime — when the visit is scheduled. */
  scheduledDateIso?: string | null
  /** Geo coordinates of the customer address (preferred). */
  latitude?: number | null
  longitude?: number | null
}

export type MatchReason =
  | 'distance'
  | 'skill'
  | 'category'
  | 'rating'
  | 'workload'
  | 'experience'
  | 'availability'
  | 'schedule'

export interface MatchBreakdown {
  reason: MatchReason
  /** 0–100, contribution to the final score (already weighted). */
  contribution: number
  /** Short human label shown in tooltips and reasoning chips. */
  label: string
  /** Optional raw metric ("3.2 km", "2 of 3 skills", …). */
  detail?: string
}

export interface MatchResult {
  professional: Professional
  /** Final 0–100 fit score. */
  score: number
  /** "excellent" | "good" | "fair" — useful for badge color in the UI. */
  band: 'excellent' | 'good' | 'fair' | 'weak'
  /** Distance in km from booking to professional base; undefined if unknown. */
  distanceKm: number | undefined
  /** Detailed contribution per reason for tooltips / drill-down. */
  breakdown: MatchBreakdown[]
  /** Soft reasons why the pro may not be ideal (shown as warnings). */
  warnings: string[]
  /** Hard reasons the pro is ineligible (filter step). Empty when eligible. */
  ineligibleReasons: string[]
  /** Whether this pro passed the hard eligibility filter. */
  eligible: boolean
}

/* ------------------------------------------------------------------ */
/* Weights — tune here once. Numbers MUST sum to 100.                 */
/* ------------------------------------------------------------------ */

const WEIGHTS = {
  distance: 35,
  skill: 20,
  category: 10,
  rating: 10,
  workload: 5,
  experience: 5,
  availability: 5,
  schedule: 10,
} as const

/** Max distance (km) where a candidate still scores anything. */
const DISTANCE_CUTOFF_KM = 25
/** Above this many active jobs in flight, workload score drops to 0. */
const WORKLOAD_HEAVY_THRESHOLD = 8
/** Above this many years, experience contribution maxes out. */
const EXPERIENCE_CAP_YEARS = 10

/* ------------------------------------------------------------------ */
/* Geo helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Great-circle distance in km between two lat/lng points (Haversine).
 * Returns undefined when either point is incomplete.
 */
export function haversineDistanceKm(
  a: { latitude?: number | null; longitude?: number | null } | null | undefined,
  b: { latitude?: number | null; longitude?: number | null } | null | undefined,
): number | undefined {
  const lat1 = a?.latitude
  const lon1 = a?.longitude
  const lat2 = b?.latitude
  const lon2 = b?.longitude
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return undefined
  }
  const R = 6371
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function professionalBaseCoords(pro: Professional): { latitude?: number; longitude?: number } | undefined {
  const c = pro.address?.coordinates
  if (!c) return undefined
  if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
    return { latitude: c.latitude, longitude: c.longitude }
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Normalization helpers                                              */
/* ------------------------------------------------------------------ */

function norm(s: string | null | undefined): string {
  return (s ?? '').toString().trim().toLowerCase()
}

function uniqNorm(list: Array<string | null | undefined>): string[] {
  return Array.from(new Set(list.map(norm).filter(Boolean)))
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

/** Returns the slots on the booking's weekday. Empty when day is off. */
export function professionalSlotsForBooking(
  pro: Pick<Professional, 'weeklyAvailability' | 'workingDays' | 'workingHours'>,
  scheduledIso: string | undefined | null,
): { day: ProfessionalWeekdayKey | null; slotCount: number; anyWeekly: boolean } {
  if (!scheduledIso) return { day: null, slotCount: 0, anyWeekly: false }
  const d = new Date(scheduledIso)
  if (Number.isNaN(d.getTime())) return { day: null, slotCount: 0, anyWeekly: false }
  const key = JS_DAY_TO_KEY[d.getDay()]
  const weekly = normalizeWeeklyAvailability(pro.weeklyAvailability)
  const anyWeekly = PROFESSIONAL_WEEKDAY_KEYS.some((k) => weekly[k].length > 0)
  return { day: key, slotCount: weekly[key].length, anyWeekly }
}

/** True when the professional's address city or service areas include the booking city. */
function coversServiceArea(pro: Professional, input: BookingMatchInput): boolean {
  const city = norm(input.city)
  const pincode = norm(input.pincode)
  if (!city && !pincode) return true
  const ownCity = norm(pro.address?.city)
  if (city && ownCity && ownCity === city) return true
  if (Array.isArray(pro.serviceAreas)) {
    for (const area of pro.serviceAreas) {
      if (city && norm(area?.city) === city) return true
      if (pincode && Array.isArray(area?.pincodes) && area.pincodes.map(norm).includes(pincode)) return true
    }
  }
  return false
}

/* ------------------------------------------------------------------ */
/* Eligibility (hard filter)                                          */
/* ------------------------------------------------------------------ */

interface EligibilityResult {
  eligible: boolean
  reasons: string[]
  warnings: string[]
}

function evaluateEligibility(pro: Professional, input: BookingMatchInput): EligibilityResult {
  const reasons: string[] = []
  const warnings: string[] = []

  if (pro.isActive === false) reasons.push('Account is inactive')
  if (pro.accountStatus && pro.accountStatus !== 'active') {
    reasons.push(`Account ${pro.accountStatus}`)
  }
  if (pro.isVerified === false) reasons.push('Not verified')
  if (pro.availability === 'offline') reasons.push('Currently offline')

  if (input.category) {
    const cats = uniqNorm(pro.categories || [])
    if (cats.length > 0 && !cats.includes(norm(input.category))) {
      reasons.push(`Doesn't cover "${input.category}" category`)
    }
  }

  if (!coversServiceArea(pro, input)) {
    reasons.push(`No service area match (${input.city || input.pincode || 'location'})`)
  }

  // Scheduled day is closed → warn, don't block (admin can still override).
  const dayHint = bookingScheduledDayHint(input.scheduledDateIso ?? undefined, pro)
  if (dayHint === 'closed') {
    warnings.push('Off on their weekly calendar that day')
  }

  if (pro.availability === 'busy') {
    warnings.push('Currently busy on another job')
  }

  return { eligible: reasons.length === 0, reasons, warnings }
}

/* ------------------------------------------------------------------ */
/* Scoring (soft)                                                     */
/* ------------------------------------------------------------------ */

function distanceScore(distanceKm: number | undefined): { score: number; detail: string } {
  if (distanceKm == null) return { score: 0.5 * WEIGHTS.distance, detail: 'Distance unknown' }
  if (distanceKm <= 1) return { score: WEIGHTS.distance, detail: `${distanceKm.toFixed(1)} km away` }
  if (distanceKm >= DISTANCE_CUTOFF_KM) {
    return { score: 0, detail: `${distanceKm.toFixed(1)} km — beyond ${DISTANCE_CUTOFF_KM} km` }
  }
  // Linear decay from 1 km (full weight) to DISTANCE_CUTOFF_KM (zero).
  const ratio = 1 - (distanceKm - 1) / (DISTANCE_CUTOFF_KM - 1)
  return {
    score: Math.max(0, WEIGHTS.distance * ratio),
    detail: `${distanceKm.toFixed(1)} km away`,
  }
}

function skillScore(
  pro: Professional,
  required: string[],
): { score: number; detail: string; warning?: string } {
  if (!required.length) {
    return { score: WEIGHTS.skill * 0.75, detail: 'No required skills declared' }
  }
  const proSkills = new Set(uniqNorm(pro.skills || []))
  const proCats = new Set(uniqNorm(pro.categories || []))
  const matched = required.filter((s) => proSkills.has(s) || proCats.has(s))
  const ratio = matched.length / required.length
  const detail = `${matched.length}/${required.length} skills`
  const warning =
    matched.length === 0 ? `No required skill match (${required.slice(0, 3).join(', ')})` : undefined
  return { score: WEIGHTS.skill * ratio, detail, warning }
}

function categoryScore(pro: Professional, category: string | null | undefined): {
  score: number
  detail: string
} {
  const c = norm(category)
  if (!c) return { score: WEIGHTS.category * 0.6, detail: 'No category specified' }
  const cats = new Set(uniqNorm(pro.categories || []))
  if (cats.has(c)) return { score: WEIGHTS.category, detail: `Covers "${category}"` }
  return { score: 0, detail: `Does not cover "${category}"` }
}

function ratingScore(pro: Professional): { score: number; detail: string } {
  const reviews = pro.totalReviews ?? 0
  const rating = pro.rating ?? 0
  if (reviews === 0) {
    return { score: WEIGHTS.rating * 0.4, detail: 'New — no reviews yet' }
  }
  // 5★ → full weight, 1★ → 0
  const ratio = Math.max(0, Math.min(1, (rating - 1) / 4))
  return {
    score: WEIGHTS.rating * ratio,
    detail: `${rating.toFixed(1)}★ from ${reviews} review${reviews === 1 ? '' : 's'}`,
  }
}

function workloadScore(pro: Professional): { score: number; detail: string; warning?: string } {
  // Heuristic when API doesn't expose live workload: use availability.
  if (pro.availability === 'available') return { score: WEIGHTS.workload, detail: 'Free now' }
  if (pro.availability === 'busy') {
    return { score: WEIGHTS.workload * 0.3, detail: 'Busy on another job', warning: 'Currently busy' }
  }
  return { score: 0, detail: 'Offline' }
}

function experienceScore(pro: Professional): { score: number; detail: string } {
  const yrs = Math.max(0, Number(pro.experience) || 0)
  const ratio = Math.min(1, yrs / EXPERIENCE_CAP_YEARS)
  const expBonus = pro.expertiseLevel === 'expert' ? 1 : pro.expertiseLevel === 'intermediate' ? 0.6 : 0.3
  const blended = (ratio + expBonus) / 2
  return {
    score: WEIGHTS.experience * blended,
    detail: `${yrs} yr${yrs === 1 ? '' : 's'} · ${pro.expertiseLevel || 'beginner'}`,
  }
}

function availabilityScore(pro: Professional): { score: number; detail: string } {
  if (pro.availability === 'available') return { score: WEIGHTS.availability, detail: 'Available' }
  if (pro.availability === 'busy') return { score: WEIGHTS.availability * 0.4, detail: 'Busy' }
  return { score: 0, detail: 'Offline' }
}

function scheduleScore(
  pro: Professional,
  scheduledIso: string | null | undefined,
): { score: number; detail: string; warning?: string } {
  if (!scheduledIso) return { score: WEIGHTS.schedule * 0.7, detail: 'Time not set' }
  const hint = bookingScheduledDayHint(scheduledIso, pro)
  if (hint === 'open') return { score: WEIGHTS.schedule, detail: 'Open on their calendar' }
  if (hint === 'closed') {
    return { score: 0, detail: 'Off on weekly calendar', warning: 'Off on their weekly calendar that day' }
  }
  return { score: WEIGHTS.schedule * 0.5, detail: 'No calendar on file' }
}

function bandFromScore(score: number): MatchResult['band'] {
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 45) return 'fair'
  return 'weak'
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Score a single professional against a booking.
 * Returns the full breakdown so the UI can render a "why" panel.
 */
export function scoreProfessional(
  pro: Professional,
  input: BookingMatchInput,
): MatchResult {
  const required = uniqNorm(input.skills || [])
  const elig = evaluateEligibility(pro, input)

  const proCoords = professionalBaseCoords(pro)
  const distanceKm = haversineDistanceKm(
    input.latitude != null && input.longitude != null
      ? { latitude: input.latitude, longitude: input.longitude }
      : null,
    proCoords ?? null,
  )

  const d = distanceScore(distanceKm)
  const s = skillScore(pro, required)
  const c = categoryScore(pro, input.category)
  const r = ratingScore(pro)
  const w = workloadScore(pro)
  const x = experienceScore(pro)
  const av = availabilityScore(pro)
  const sch = scheduleScore(pro, input.scheduledDateIso)

  const breakdown: MatchBreakdown[] = [
    { reason: 'distance', contribution: d.score, label: 'Proximity', detail: d.detail },
    { reason: 'skill', contribution: s.score, label: 'Skill match', detail: s.detail },
    { reason: 'category', contribution: c.score, label: 'Category fit', detail: c.detail },
    { reason: 'rating', contribution: r.score, label: 'Customer rating', detail: r.detail },
    { reason: 'workload', contribution: w.score, label: 'Workload', detail: w.detail },
    { reason: 'experience', contribution: x.score, label: 'Experience', detail: x.detail },
    { reason: 'availability', contribution: av.score, label: 'Availability', detail: av.detail },
    { reason: 'schedule', contribution: sch.score, label: 'Schedule', detail: sch.detail },
  ]

  const score = Math.round(
    breakdown.reduce((sum, b) => sum + (Number.isFinite(b.contribution) ? b.contribution : 0), 0),
  )

  const warnings = [
    ...elig.warnings,
    ...(s.warning ? [s.warning] : []),
    ...(w.warning ? [w.warning] : []),
    ...(sch.warning ? [sch.warning] : []),
  ]

  return {
    professional: pro,
    score: Math.max(0, Math.min(100, score)),
    band: bandFromScore(score),
    distanceKm,
    breakdown,
    warnings,
    ineligibleReasons: elig.reasons,
    eligible: elig.eligible,
  }
}

/**
 * Score and rank a fleet against a booking.
 * Eligible candidates come first (sorted by score desc), then ineligibles
 * (so admin can still see them with "blocked because…" copy).
 */
export function rankProfessionals(
  professionals: Professional[],
  input: BookingMatchInput,
): MatchResult[] {
  const scored = professionals.map((p) => scoreProfessional(p, input))
  return scored.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
    return b.score - a.score
  })
}

/**
 * Pick the single best candidate — used by the auto-assign button.
 * Returns undefined when no eligible candidate exists.
 */
export function pickBestProfessional(
  professionals: Professional[],
  input: BookingMatchInput,
): MatchResult | undefined {
  const ranked = rankProfessionals(professionals, input)
  const best = ranked.find((m) => m.eligible)
  if (!best || best.score < 30) return undefined
  return best
}

/**
 * Helper: derive a search hint sentence used in toasts / activity logs.
 *   "Auto-picked Riya P. — 92/100 (1.4 km · 3/3 skills · 4.8★)"
 */
export function describeMatch(m: MatchResult): string {
  const distance = m.distanceKm != null ? `${m.distanceKm.toFixed(1)} km` : 'distance N/A'
  const skill = m.breakdown.find((b) => b.reason === 'skill')?.detail || ''
  const rating = m.breakdown.find((b) => b.reason === 'rating')?.detail || ''
  const parts = [`${m.score}/100`, distance, skill, rating].filter(Boolean)
  return `${m.professional.firstName} ${m.professional.lastName} — ${parts.join(' · ')}`
}
