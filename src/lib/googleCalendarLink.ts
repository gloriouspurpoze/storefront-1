/**
 * Build a Google Calendar “create event” URL (opens signed-in user’s calendar with fields prefilled).
 * No OAuth in the admin app — the user confirms/saves the event in Google Calendar.
 *
 * @see https://calendar.google.com/calendar/render?action=TEMPLATE&...
 */

/** `dates` segment: YYYYMMDDTHHmmssZ (UTC). */
export function formatDateForGoogleCalendar(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}T${h}${min}${s}Z`
}

/** Parse `<input type="datetime-local">` value as local time. */
export function parseDatetimeLocal(value: string): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export type GoogleCalendarEventDraft = {
  title: string
  start: Date
  end: Date
  details?: string
  location?: string
  /** Invites appear as suggestions; user can send from Google Calendar. */
  guestEmails?: string[]
}

export function buildGoogleCalendarCreateUrl(opts: GoogleCalendarEventDraft): string {
  const dates = `${formatDateForGoogleCalendar(opts.start)}/${formatDateForGoogleCalendar(opts.end)}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates,
  })
  if (opts.details?.trim()) params.set('details', opts.details.trim())
  if (opts.location?.trim()) params.set('location', opts.location.trim())
  const guests = (opts.guestEmails || []).map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (guests.length) params.set('add', guests.join(','))
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Next full hour (local) and +1h end — good defaults for “book a slot”. */
export function defaultMeetingStartEnd(): { start: Date; end: Date } {
  const start = new Date()
  start.setSeconds(0, 0)
  start.setMinutes(0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return { start, end }
}
