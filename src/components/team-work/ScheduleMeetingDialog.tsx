import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, ExternalLink } from 'lucide-react'
import {
  buildGoogleCalendarCreateUrl,
  defaultMeetingStartEnd,
  parseDatetimeLocal,
} from '../../lib/googleCalendarLink'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

export type ScheduleMeetingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown as default event title */
  defaultTitle: string
  /** Appended or used as default description (e.g. issue body, project notes) */
  defaultDetails?: string
  /** Pre-filled invite list (e.g. board members’ emails) */
  defaultGuestEmails?: string[]
}

function toLocalInput(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  defaultTitle,
  defaultDetails = '',
  defaultGuestEmails = [],
}: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [location, setLocation] = useState('')
  const [details, setDetails] = useState('')
  const [guestsLine, setGuestsLine] = useState('')

  useEffect(() => {
    if (!open) return
    const { start, end } = defaultMeetingStartEnd()
    setTitle(defaultTitle.trim() || 'Team meeting')
    setStartLocal(toLocalInput(start))
    setEndLocal(toLocalInput(end))
    setLocation('')
    setDetails(defaultDetails.trim())
    setGuestsLine(defaultGuestEmails.filter(Boolean).join(', '))
  }, [open, defaultTitle, defaultDetails, defaultGuestEmails])

  const openInGoogleCalendar = () => {
    const start = parseDatetimeLocal(startLocal)
    const end = parseDatetimeLocal(endLocal)
    if (!start || !end || end.getTime() <= start.getTime()) return
    const guestEmails = guestsLine
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes('@'))
    const url = buildGoogleCalendarCreateUrl({
      title: title.trim() || 'Team meeting',
      start,
      end,
      details: details.trim() || undefined,
      location: location.trim() || undefined,
      guestEmails: guestEmails.length ? guestEmails : undefined,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  const startOk = parseDatetimeLocal(startLocal)
  const endOk = parseDatetimeLocal(endLocal)
  const rangeOk = Boolean(startOk && endOk && endOk.getTime() > startOk.getTime())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            Schedule in Google Calendar
          </DialogTitle>
          <DialogDescription>
            Opens Google Calendar in a new tab with this event prefilled. You still confirm or edit there — no extra
            Fixer sign-in. For org-wide CRM calendar sync (imports), use{' '}
            <span className="font-medium text-foreground">CRM → Settings</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-2">
            <Label htmlFor="sm-title">Title</Label>
            <Input id="sm-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sprint planning" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sm-start">Start</Label>
              <Input id="sm-start" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sm-end">End</Label>
              <Input id="sm-end" type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-loc">Location or video link (optional)</Label>
            <Input
              id="sm-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Meet link, office, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-details">Description (optional)</Label>
            <Textarea id="sm-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-guests">Guest emails (optional)</Label>
            <Input
              id="sm-guests"
              value={guestsLine}
              onChange={(e) => setGuestsLine(e.target.value)}
              placeholder="comma-separated@example.com"
            />
            <p className="text-[11px] text-muted-foreground">
              Google adds them as invitees; sending the invite is done in the Calendar tab.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="gap-1.5" disabled={!rangeOk} onClick={openInGoogleCalendar}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            Open in Google Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
