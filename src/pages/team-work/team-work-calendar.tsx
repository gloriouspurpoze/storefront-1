import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Video,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { parseTeamCalendarProjectKeys, resolveCalendarProjectIds } from '../../lib/teamWorkCalendarScope'
import { teamWorkApi } from '../../services/api/teamWork.api'
import type {
  TeamWorkCalendarEvent,
  TeamWorkCalendarFeed,
  TeamWorkCeremonySeries,
  TeamWorkProject,
} from '../../types/teamWork.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'

type CalendarViewMode = 'week' | 'month' | 'year'

function calendarGridDays(monthAnchor: Date): Date[] {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)
  const gridStart = startOfWeek(start, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(end, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

/** Native tooltip: numbered titles + times (browser shows on hover). */
function yearDayEventsTooltip(events: TeamWorkCalendarEvent[], maxLines = 14): string {
  if (!events.length) return ''
  const lines = events.slice(0, maxLines).map((ev, i) => {
    const t = format(new Date(ev.start), 'HH:mm')
    return `${i + 1}. ${ev.title} (${t})`
  })
  if (events.length > maxLines) lines.push(`… +${events.length - maxLines} more`)
  return lines.join('\n')
}

function groupEventsByDay(events: TeamWorkCalendarEvent[]): Map<string, TeamWorkCalendarEvent[]> {
  const m = new Map<string, TeamWorkCalendarEvent[]>()
  for (const ev of events) {
    const key = format(new Date(ev.start), 'yyyy-MM-dd')
    const list = m.get(key) || []
    list.push(ev)
    m.set(key, list)
  }
  for (const list of Array.from(m.values())) {
    list.sort((a: TeamWorkCalendarEvent, b: TeamWorkCalendarEvent) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }
  return m
}

export function TeamWorkCalendarPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_team_tasks')
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [focusDate, setFocusDate] = useState(() => new Date())
  const [includeGoogle, setIncludeGoogle] = useState(false)
  const [feed, setFeed] = useState<TeamWorkCalendarFeed | null>(null)
  const [ceremonies, setCeremonies] = useState<TeamWorkCeremonySeries[]>([])
  const [projects, setProjects] = useState<TeamWorkProject[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [googleStatus, setGoogleStatus] = useState<{ googleConnected: boolean } | null>(null)

  const [meetOpen, setMeetOpen] = useState(false)
  const [meetTitle, setMeetTitle] = useState('')
  const [meetStart, setMeetStart] = useState('')
  const [meetEnd, setMeetEnd] = useState('')
  const [meetDesc, setMeetDesc] = useState('')
  const [meetGuests, setMeetGuests] = useState('')
  const [meetCreateVideo, setMeetCreateVideo] = useState(true)
  const [meetSaving, setMeetSaving] = useState(false)
  const [meetResult, setMeetResult] = useState<{ htmlLink?: string; hangoutLink?: string } | null>(null)

  const [ceremonyOpen, setCeremonyOpen] = useState(false)
  const [cProjectId, setCProjectId] = useState('')
  const [cTitle, setCTitle] = useState('Stand-up')
  const [cAnchor, setCAnchor] = useState('')
  const [cRecurrence, setCRecurrence] = useState<TeamWorkCeremonySeries['recurrence']>('weekly')
  const [cDuration, setCDuration] = useState(30)
  const [cSaving, setCSaving] = useState(false)

  const range = useMemo(() => {
    if (viewMode === 'week') {
      const from = startOfWeek(focusDate, { weekStartsOn: 1 })
      const to = endOfWeek(focusDate, { weekStartsOn: 1 })
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`,
      }
    }
    if (viewMode === 'month') {
      const from = startOfMonth(focusDate)
      const to = endOfMonth(focusDate)
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: format(focusDate, 'MMMM yyyy'),
      }
    }
    const from = startOfYear(focusDate)
    const to = endOfYear(focusDate)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: format(focusDate, 'yyyy'),
    }
  }, [viewMode, focusDate])

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: new Date(range.from), end: new Date(range.to) }),
    [range.from, range.to],
  )

  const monthGridDays = useMemo(() => calendarGridDays(focusDate), [focusDate])

  const yearMonthStarts = useMemo(() => {
    const y = focusDate.getFullYear()
    return Array.from({ length: 12 }, (_, i) => new Date(y, i, 1))
  }, [focusDate])

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const calKeys = parseTeamCalendarProjectKeys()
      const [projs, g] = await Promise.all([
        teamWorkApi.listProjects(),
        teamWorkApi.getGoogleCalendarStatus().catch(() => ({ googleConnected: false })),
      ])
      const scopedIds = resolveCalendarProjectIds(projs)
      const primaryPid = scopedIds[0] ?? ''

      const [f, cer] = await Promise.all([
        teamWorkApi.getCalendarFeed({
          from: range.from,
          to: range.to,
          includeGoogle,
          projectKeys: calKeys.length ? calKeys : undefined,
        }),
        primaryPid ? teamWorkApi.listCeremonies(primaryPid) : Promise.resolve([]),
      ])

      setFeed(f)
      setProjects(projs)
      setCeremonies(cer)
      setGoogleStatus(g)
      setCProjectId((prev) => (prev && scopedIds.includes(prev) ? prev : primaryPid))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not load calendar')
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to, includeGoogle])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const tw = searchParams.get('tw_google')
    if (!tw) return
    setSearchParams({}, { replace: true })
    if (tw === 'connected') {
      void teamWorkApi.getGoogleCalendarStatus().then(setGoogleStatus)
    }
  }, [searchParams, setSearchParams])

  const byDay = useMemo(() => (feed ? groupEventsByDay(feed.events) : new Map<string, TeamWorkCalendarEvent[]>()), [feed])

  const connectGoogle = async () => {
    const url = await teamWorkApi.getGoogleCalendarOAuthUrl()
    window.location.href = url
  }

  const submitMeet = async () => {
    if (!meetTitle.trim() || !meetStart || !meetEnd) return
    setMeetSaving(true)
    setMeetResult(null)
    try {
      const row = await teamWorkApi.createGoogleCalendarEvent({
        title: meetTitle.trim(),
        description: meetDesc.trim() || undefined,
        start: new Date(meetStart).toISOString(),
        end: new Date(meetEnd).toISOString(),
        attendeeEmails: meetGuests
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        createMeet: meetCreateVideo,
      })
      const hangoutLink =
        (row.hangoutLink as string | undefined) ||
        (row.conferenceData as { entryPoints?: { uri?: string }[] } | undefined)?.entryPoints?.find((e) =>
          String(e.uri || '').includes('meet.google'),
        )?.uri
      setMeetResult({
        htmlLink: row.htmlLink as string | undefined,
        hangoutLink: hangoutLink as string | undefined,
      })
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create event')
    } finally {
      setMeetSaving(false)
    }
  }

  const submitCeremony = async () => {
    if (!cProjectId || !cTitle.trim() || !cAnchor) return
    setCSaving(true)
    try {
      await teamWorkApi.createCeremony({
        projectId: cProjectId,
        title: cTitle.trim(),
        anchorStart: new Date(cAnchor).toISOString(),
        durationMinutes: cDuration,
        recurrence: cRecurrence,
      })
      setCeremonyOpen(false)
      void load()
      const list = await teamWorkApi.listCeremonies()
      setCeremonies(list)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save ceremony')
    } finally {
      setCSaving(false)
    }
  }

  useEffect(() => {
    if (!ceremonyOpen || cAnchor) return
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    setCAnchor(format(d, "yyyy-MM-dd'T'HH:mm"))
  }, [ceremonyOpen, cAnchor])

  const stepCalendar = (dir: -1 | 1) => {
    setFocusDate((d) => {
      if (viewMode === 'week') return addWeeks(d, dir)
      if (viewMode === 'month') return addMonths(d, dir)
      return addYears(d, dir)
    })
  }

  const goThisPeriod = () => setFocusDate(new Date())

  const openMonthFromYearCard = (monthStart: Date) => {
    setFocusDate(startOfMonth(monthStart))
    setViewMode('month')
  }

  /** Preserves the calendar day (e.g. padding days jump to the correct month). */
  const openMonthForDay = (day: Date) => {
    setFocusDate(day)
    setViewMode('month')
  }

  const periodNavLabel =
    viewMode === 'week' ? { prev: 'Previous week', next: 'Next week', today: 'This week' } : viewMode === 'month'
      ? { prev: 'Previous month', next: 'Next month', today: 'This month' }
      : { prev: 'Previous year', next: 'Next year', today: 'This year' }

  const renderEventCard = (ev: TeamWorkCalendarEvent, compact?: boolean) => {
    const isStartLine = ev.kind === 'due' && ev.title.startsWith('Start ·')
    return (
    <div
      key={ev.id}
      className={cn(
        'rounded-md border px-2 py-1.5 leading-snug',
        compact ? 'text-[10px]' : 'text-[11px]',
        ev.kind === 'due' && !isStartLine && 'border-primary/30 bg-primary/5',
        isStartLine && 'border-storm-deep/30 bg-storm-deep/5',
        ev.kind === 'ceremony' && 'border-bloom-coral/30 bg-bloom-coral/5',
        ev.kind === 'google' && 'border-primary/30 bg-primary/5',
      )}
    >
      <p className={cn('font-medium text-foreground', compact ? 'line-clamp-2' : 'line-clamp-3')}>{ev.title}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {format(new Date(ev.start), 'HH:mm')}–{format(new Date(ev.end), 'HH:mm')}
        {ev.projectKey ? ` · ${ev.projectKey}` : ''}
      </p>
      {!compact && ev.kind === 'due' && ev.issueId ? (
        <Link to="/team-work" className="mt-1 inline-block text-[10px] font-medium text-primary hover:underline">
          Open board
        </Link>
      ) : null}
      {ev.htmlLink ? (
        <a
          href={ev.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
        >
          Google <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ) : null}
      {ev.hangoutLink ? (
        <a
          href={ev.hangoutLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-storm-deep hover:underline"
        >
          Meet <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ) : null}
    </div>
    )
  }

  useEffect(() => {
    if (!meetOpen || meetStart) return
    const s = new Date()
    s.setMinutes(Math.ceil(s.getMinutes() / 15) * 15, 0, 0)
    s.setHours(s.getHours() + 1)
    const e = new Date(s.getTime() + 60 * 60 * 1000)
    setMeetStart(format(s, "yyyy-MM-dd'T'HH:mm"))
    setMeetEnd(format(e, "yyyy-MM-dd'T'HH:mm"))
  }, [meetOpen, meetStart])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Team calendar"
        subtitle="Due dates and ceremonies are scoped to project keys from REACT_APP_TEAM_WORK_CALENDAR_PROJECT_KEYS (default PF / ProFixer). Optional Google overlay is unchanged."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/team-work">Back to boards</Link>
          </Button>
        }
      />

      {err ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{err}</CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as CalendarViewMode)
            }}
          >
            <SelectTrigger className="h-9 w-[120px]" aria-label="Calendar view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={() => stepCalendar(-1)} aria-label={periodNavLabel.prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goThisPeriod}>
            {periodNavLabel.today}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => stepCalendar(1)} aria-label={periodNavLabel.next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {range.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          {googleStatus?.googleConnected ? (
            <Badge variant="secondary" className="font-normal">
              Google connected
            </Badge>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={() => void connectGoogle()}>
              Connect Google (Meet)
            </Button>
          )}
          {googleStatus?.googleConnected ? (
            <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
              <Switch id="ig" checked={includeGoogle} onCheckedChange={setIncludeGoogle} />
              <Label htmlFor="ig" className="text-xs text-muted-foreground">
                Show my Google events
              </Label>
            </div>
          ) : null}
          {canManage ? (
            <>
              <Button type="button" size="sm" className="gap-1.5" onClick={() => setMeetOpen(true)}>
                <Video className="h-3.5 w-3.5" />
                Create Meet / event
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setCeremonyOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Recurring ceremony
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recurring ceremonies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {ceremonies.length === 0 ? (
            <p>No ceremonies yet. Managers can add standups or sprint rituals (daily / weekly from the anchor time).</p>
          ) : (
            <ul className="space-y-2">
              {ceremonies.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="text-xs">
                    {c.recurrence} · {format(new Date(c.anchorStart), 'PPp')} · {c.durationMinutes}m · project{' '}
                    <span className="font-mono">{projects.find((p) => p.id === c.projectId)?.key ?? c.projectId}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {viewMode === 'week' ? (
        <div className="grid gap-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const list = byDay.get(key) || []
            return (
              <Card key={key} className="min-h-[180px] border-border/80">
                <CardHeader className="space-y-0 border-b bg-muted/30 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{format(day, 'EEE')}</p>
                  <p
                    className={cn(
                      'text-lg font-semibold tabular-nums',
                      isToday(day) && 'text-primary',
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 p-2">
                  {list.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">—</p>
                  ) : (
                    list.map((ev) => renderEventCard(ev, false))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {viewMode === 'month' ? (
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="border-b bg-muted/20 py-3">
            <CardTitle className="text-base font-semibold">{range.label}</CardTitle>
            <p className="text-xs text-muted-foreground">Weeks start on Monday. Load range matches this month.</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-px rounded-lg border border-border/60 bg-border/40 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-muted/40 py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px rounded-b-lg border border-t-0 border-border/60 bg-border/40">
              {monthGridDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const list = byDay.get(key) || []
                const inMonth = isSameMonth(day, focusDate)
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex min-h-[100px] flex-col border-b border-border/30 bg-background p-1.5 sm:min-h-[120px] sm:p-2',
                      !inMonth && 'bg-muted/15 text-muted-foreground',
                      isToday(day) && 'ring-1 ring-inset ring-primary/40',
                      !isToday(day) && isSameDay(day, focusDate) && 'ring-1 ring-inset ring-muted-foreground/35',
                    )}
                  >
                    <p className={cn('text-xs font-semibold tabular-nums sm:text-sm', isToday(day) && 'text-primary')}>
                      {format(day, 'd')}
                    </p>
                    <div className="mt-1 flex flex-1 flex-col gap-1 overflow-hidden">
                      {list.length === 0 ? null : (
                        <>
                          {list.slice(0, 3).map((ev) => renderEventCard(ev, true))}
                          {list.length > 3 ? (
                            <p className="text-[10px] text-muted-foreground">+{list.length - 3} more</p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {viewMode === 'year' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Twelve-month overview for {range.label}. Hover a day with a dot to see event titles. Click a month card or any day
            to open that month in Month view.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {yearMonthStarts.map((monthStart) => {
              const grid = calendarGridDays(monthStart)
              return (
                <Card
                  key={monthStart.getTime()}
                  role="button"
                  tabIndex={0}
                  className="overflow-hidden border-border/80 transition-colors hover:border-primary/35 hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openMonthFromYearCard(monthStart)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openMonthFromYearCard(monthStart)
                    }
                  }}
                  aria-label={`Open ${format(monthStart, 'MMMM yyyy')} in month view`}
                >
                  <CardHeader className="border-b bg-muted/20 py-2">
                    <CardTitle className="text-sm font-semibold">{format(monthStart, 'MMMM')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-1.5">
                    <div className="grid grid-cols-7 gap-px text-[8px] font-medium text-muted-foreground">
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                        <div key={d} className="py-0.5 text-center">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="mt-px grid grid-cols-7 gap-px">
                      {grid.map((day) => {
                        const key = format(day, 'yyyy-MM-dd')
                        const list = byDay.get(key) || []
                        const inMonth = isSameMonth(day, monthStart)
                        const tip =
                          list.length > 0
                            ? yearDayEventsTooltip(list)
                            : `${format(day, 'EEEE, MMM d')}\nClick to open in month view`
                        return (
                          <div
                            key={key}
                            role="presentation"
                            title={tip}
                            className={cn(
                              'flex min-h-[22px] flex-col items-center justify-start rounded-sm border border-transparent p-0.5',
                              !inMonth && 'text-muted-foreground/40',
                              isToday(day) && 'bg-primary/10 font-semibold text-primary',
                              'cursor-pointer hover:bg-muted/40',
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              openMonthForDay(day)
                            }}
                          >
                            <span className="text-[10px] tabular-nums leading-none">{format(day, 'd')}</span>
                            {list.length > 0 ? (
                              <span
                                className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : null}

      <Dialog open={meetOpen} onOpenChange={setMeetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Google Calendar event</DialogTitle>
            <DialogDescription>
              Uses your connected Google account. Enable Meet to add a conference link. Invites are sent from Google when you save
              the event there.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)} placeholder="Design review" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="datetime-local" value={meetStart} onChange={(e) => setMeetStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="datetime-local" value={meetEnd} onChange={(e) => setMeetEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={meetDesc} onChange={(e) => setMeetDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Guest emails (comma-separated)</Label>
              <Input value={meetGuests} onChange={(e) => setMeetGuests(e.target.value)} placeholder="a@co.com, b@co.com" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="mv" checked={meetCreateVideo} onCheckedChange={setMeetCreateVideo} />
              <Label htmlFor="mv">Add Google Meet</Label>
            </div>
            {meetResult?.htmlLink ? (
              <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">Created</p>
                {meetResult.hangoutLink ? (
                  <a href={meetResult.hangoutLink} target="_blank" rel="noopener noreferrer" className="mt-1 block text-primary hover:underline">
                    Open Meet
                  </a>
                ) : null}
                <a href={meetResult.htmlLink} target="_blank" rel="noopener noreferrer" className="mt-1 block text-primary hover:underline">
                  Open in Google Calendar
                </a>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setMeetOpen(false)}>
              Close
            </Button>
            <Button type="button" disabled={meetSaving || !meetTitle.trim()} onClick={() => void submitMeet()}>
              {meetSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ceremonyOpen} onOpenChange={setCeremonyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New recurring ceremony</DialogTitle>
            <DialogDescription>Repeats from the anchor date/time (UTC stored; displayed in your browser timezone).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label>Project board</Label>
              <Select value={cProjectId} onValueChange={setCProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.key} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Anchor (first occurrence)</Label>
              <Input type="datetime-local" value={cAnchor} onChange={(e) => setCAnchor(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={cRecurrence} onValueChange={(v) => setCRecurrence(v as TeamWorkCeremonySeries['recurrence'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" min={5} max={720} value={cDuration} onChange={(e) => setCDuration(Number(e.target.value) || 30)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCeremonyOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={cSaving || !cProjectId} onClick={() => void submitCeremony()}>
              {cSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
