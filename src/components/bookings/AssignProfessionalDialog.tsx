/**
 * Assign professional dialog — supports two industry-standard flows:
 *
 *   • Auto-assign (recommended): the engine ranks the fleet by a weighted
 *     mix of proximity, skill / category fit, rating, workload and
 *     schedule day. The top eligible match is highlighted; admin can
 *     auto-assign in one click or fall back to a runner-up.
 *
 *   • Manual: filter the fleet by category / availability / expertise /
 *     search; every card still shows the fit score so admins know how
 *     a hand-pick compares to the algorithm's choice.
 *
 * The hard eligibility filter (active, verified, in service area, skill
 * overlap, not offline) hides candidates the dispatcher should never see;
 * soft scores rank the rest.
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import { cn } from '../../lib/utils'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { BookingsService } from '../../services/api/bookings.service'
import type { Professional } from '../../types/professional.types'
import { bookingScheduledDayHint, scheduleSummaryLines } from '../../lib/professionalSchedule'
import { normalizeProfessionalFromApi } from '../../lib/professionalAdmin'
import {
  describeMatch,
  pickBestProfessional,
  rankProfessionals,
  type BookingMatchInput,
  type MatchResult,
} from '../../lib/professionalAssignment'

interface AssignProfessionalDialogProps {
  open: boolean
  onClose: () => void
  bookingId: string
  /** Visit datetime (ISO) — compared to the professional's weekly hours from the app */
  scheduledDateIso?: string
  /** Booking primary service category — used for category fit scoring. */
  bookingCategory?: string
  /** Required skills, derived from booking line items / service request. */
  bookingSkills?: string[]
  bookingCity?: string
  bookingPincode?: string
  /** Customer coordinates (preferred); enables distance scoring. */
  bookingLatitude?: number
  bookingLongitude?: number
  onAssigned?: () => void
}

/* ------------------------------------------------------------------ */
/* Style helpers                                                      */
/* ------------------------------------------------------------------ */

function availabilityClass(a?: string) {
  switch (a) {
    case 'available':
      return 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink'
    case 'busy':
      return 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep'
    case 'offline':
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    default:
      return ''
  }
}

function expertiseClass(e?: string) {
  switch (e) {
    case 'expert':
      return 'border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground'
    case 'intermediate':
      return 'border-bloom-coral/40 bg-bloom-coral/10'
    case 'beginner':
      return 'border-primary/40 bg-primary/10'
    default:
      return ''
  }
}

function bandClass(band: MatchResult['band']) {
  switch (band) {
    case 'excellent':
      return 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink'
    case 'good':
      return 'border-primary/40 bg-primary/10 text-primary dark:text-primary-deep'
    case 'fair':
      return 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep'
    default:
      return 'border-muted bg-muted/40 text-muted-foreground'
  }
}

/* ------------------------------------------------------------------ */
/* Sub-component: a single professional candidate card                */
/* ------------------------------------------------------------------ */

interface CandidateCardProps {
  match: MatchResult
  scheduledDateIso?: string
  assigning: boolean
  isAutoPick?: boolean
  /** Manual admin tab: allow assigning despite eligibility warnings (not inactive accounts). */
  allowIneligibleAssign?: boolean
  onAssign: (professional: Professional) => void
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  match,
  scheduledDateIso,
  assigning,
  isAutoPick,
  allowIneligibleAssign,
  onAssign,
}) => {
  const { professional } = match
  const schedLines = scheduleSummaryLines(professional).slice(0, 2)
  const dayHint = scheduledDateIso ? bookingScheduledDayHint(scheduledDateIso, professional) : 'unknown'
  const inactiveBlocked = professional.isActive === false
  const canAssign =
    match.eligible || (allowIneligibleAssign === true && !inactiveBlocked)
  const assignLabel = match.eligible
    ? isAutoPick
      ? 'Auto-assign this match'
      : 'Assign'
    : inactiveBlocked
      ? 'Inactive — cannot assign'
      : allowIneligibleAssign
        ? 'Assign anyway'
        : 'Not eligible'

  return (
    <Card
      className={cn(
        'flex flex-col transition-shadow',
        isAutoPick && 'border-primary ring-2 ring-primary/30 shadow-lg',
        !match.eligible && 'opacity-60',
      )}
    >
      <CardContent className="flex-1 space-y-2 pt-4">
        {/* Header: avatar + name + score */}
        <div className="flex items-start gap-2">
          <Avatar className="h-12 w-12">
            {professional.profileImage ? <AvatarImage src={professional.profileImage} alt="" /> : null}
            <AvatarFallback>
              {professional.firstName[0]}
              {professional.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">
              {professional.firstName} {professional.lastName}
            </p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-bloom-coral text-bloom-coral" />
              {(professional.rating || 0).toFixed(1)} ({professional.totalReviews || 0})
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn('whitespace-nowrap px-2 py-1 text-xs font-bold', bandClass(match.band))}
              >
                {match.score}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs space-y-1">
              <p className="text-xs font-semibold">Why this score</p>
              <ul className="space-y-0.5 text-[11px]">
                {match.breakdown.map((b) => (
                  <li key={b.reason} className="flex items-baseline justify-between gap-3">
                    <span>{b.label}</span>
                    <span className="text-muted-foreground">{b.detail}</span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>

        {isAutoPick && (
          <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Best match — recommended by the engine
          </div>
        )}

        {/* Quick stats: distance + skill */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {match.distanceKm != null ? (
            <Badge variant="outline" className="gap-1 border-muted text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {match.distanceKm.toFixed(1)} km
            </Badge>
          ) : null}
          {match.breakdown.find((b) => b.reason === 'skill')?.detail ? (
            <Badge variant="outline" className="gap-1 border-muted text-muted-foreground">
              <Target className="h-3 w-3" />
              {match.breakdown.find((b) => b.reason === 'skill')?.detail}
            </Badge>
          ) : null}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={cn('text-xs capitalize', availabilityClass(professional.availability))}>
            {professional.availability || 'unknown'}
          </Badge>
          <Badge variant="outline" className={cn('text-xs capitalize', expertiseClass(professional.expertiseLevel))}>
            {professional.expertiseLevel || 'unknown'}
          </Badge>
          {professional.isVerified ? (
            <Badge variant="outline" className="gap-1 border-storm-deep/40 bg-storm-deep/10 text-xs text-storm-deep dark:text-on-ink">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          ) : null}
        </div>

        {professional.categories?.length ? (
          <div className="flex flex-wrap gap-1">
            {professional.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
            {professional.categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{professional.categories.length - 3}
              </Badge>
            )}
          </div>
        ) : null}

        {professional.address && (professional.address.area || professional.address.city) ? (
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {[professional.address.area, professional.address.city].filter(Boolean).join(', ')}
          </p>
        ) : null}

        {schedLines.length > 0 ? (
          <div className="space-y-0.5 border-t border-border/60 pt-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Weekly calendar
            </p>
            {schedLines.map((line) => (
              <p key={line} className="text-xs text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {scheduledDateIso && dayHint === 'closed' ? (
          <Badge variant="destructive" className="text-xs font-normal">
            Off on their weekly calendar that day
          </Badge>
        ) : null}

        {match.warnings.length > 0 ? (
          <ul className="space-y-0.5 rounded border border-bloom-coral/30 bg-bloom-coral/5 p-2 text-[11px] text-bloom-coral dark:text-bloom-deep">
            {match.warnings.slice(0, 3).map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        ) : null}

        {!match.eligible && match.ineligibleReasons.length > 0 ? (
          <ul className="space-y-0.5 rounded border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive">
            {match.ineligibleReasons.slice(0, 3).map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {professional.experience} yr{professional.experience === 1 ? '' : 's'} · {professional.completedJobs || 0} job
          {professional.completedJobs === 1 ? '' : 's'}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          type="button"
          className="w-full gap-1"
          onClick={() => onAssign(professional)}
          disabled={assigning || !canAssign}
          variant={isAutoPick ? 'default' : !match.eligible && allowIneligibleAssign ? 'secondary' : 'outline'}
        >
          {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          {assignLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Main dialog                                                        */
/* ------------------------------------------------------------------ */

export function AssignProfessionalDialog({
  open,
  onClose,
  bookingId,
  scheduledDateIso,
  bookingCategory,
  bookingSkills,
  bookingCity,
  bookingPincode,
  bookingLatitude,
  bookingLongitude,
  onAssigned,
}: AssignProfessionalDialogProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters (manual tab)
  const [tab, setTab] = useState<'auto' | 'manual'>('auto')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>(bookingCategory || 'all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all')
  const [hideIneligible, setHideIneligible] = useState(false)

  // Reset state every time dialog opens with a fresh booking.
  useEffect(() => {
    if (open) {
      setCategoryFilter(bookingCategory || 'all')
      setSearchQuery('')
      setAvailabilityFilter('all')
      setExpertiseFilter('all')
      setHideIneligible(false)
      setError(null)
      setSuccess(null)
      setTab('auto')
      void loadProfessionals()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingCategory])

  const loadProfessionals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ProfessionalsService.getProfessionals({
        page: 1,
        limit: 100,
      })
      const list = response.data.professionals || []
      setProfessionals(list.map((p) => normalizeProfessionalFromApi(p)))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load professionals')
    } finally {
      setLoading(false)
    }
  }

  /* -------------------- ranking -------------------- */

  const matchInput: BookingMatchInput = useMemo(
    () => ({
      category: bookingCategory ?? null,
      skills: bookingSkills ?? [],
      city: bookingCity ?? null,
      pincode: bookingPincode ?? null,
      scheduledDateIso: scheduledDateIso ?? null,
      latitude: bookingLatitude ?? null,
      longitude: bookingLongitude ?? null,
    }),
    [
      bookingCategory,
      bookingSkills,
      bookingCity,
      bookingPincode,
      scheduledDateIso,
      bookingLatitude,
      bookingLongitude,
    ],
  )

  const ranked = useMemo(
    () => rankProfessionals(professionals, matchInput),
    [professionals, matchInput],
  )

  const autoPick = useMemo(() => pickBestProfessional(professionals, matchInput), [
    professionals,
    matchInput,
  ])

  const autoRunnerUps = useMemo(
    () =>
      ranked
        .filter((m) => m.eligible && m.professional._id !== autoPick?.professional._id)
        .slice(0, 3),
    [ranked, autoPick],
  )

  /* -------------------- manual filters -------------------- */

  const filteredManual = useMemo(() => {
    let rows = ranked
    if (hideIneligible) rows = rows.filter((m) => m.eligible)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      rows = rows.filter(
        (m) =>
          `${m.professional.firstName} ${m.professional.lastName}`.toLowerCase().includes(q) ||
          m.professional.email?.toLowerCase().includes(q),
      )
    }
    if (categoryFilter !== 'all') {
      rows = rows.filter((m) => m.professional.categories?.includes(categoryFilter))
    }
    if (availabilityFilter !== 'all') {
      rows = rows.filter((m) => m.professional.availability === availabilityFilter)
    }
    if (expertiseFilter !== 'all') {
      rows = rows.filter((m) => m.professional.expertiseLevel === expertiseFilter)
    }
    return rows
  }, [ranked, hideIneligible, searchQuery, categoryFilter, availabilityFilter, expertiseFilter])

  /* -------------------- assignment -------------------- */

  const resolveProfessionalId = (professional: Professional) =>
    professional._id || professional.id || professional.professionalId

  const handleAssign = async (professional: Professional, mode: 'auto' | 'manual' = 'manual') => {
    const professionalId = resolveProfessionalId(professional)
    if (!professionalId) {
      setError('Professional record is missing an ID. Refresh and try again.')
      return
    }

    setAssigning(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await BookingsService.assignProfessional(bookingId, professionalId, {
        notifyProfessional: true,
        notifyCustomer: true,
      })
      if (!response.success) {
        throw new Error(response.message || 'Assignment failed')
      }
      const picked = ranked.find((m) => m.professional._id === professionalId)
      const summary = picked ? describeMatch(picked) : 'Professional assigned'
      setSuccess(
        mode === 'auto'
          ? `Auto-assigned · ${summary}`
          : `Manually assigned · ${summary}`,
      )
      window.setTimeout(() => {
        onAssigned?.()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      console.error('Error assigning professional:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign professional')
    } finally {
      setAssigning(false)
    }
  }

  /* -------------------- render helpers -------------------- */

  const bookingChips = useMemo(() => {
    const out: Array<{ icon: React.ReactNode; label: string }> = []
    if (bookingCategory) out.push({ icon: <Target className="h-3.5 w-3.5" />, label: bookingCategory })
    if (bookingSkills && bookingSkills.length)
      out.push({
        icon: <Sparkles className="h-3.5 w-3.5" />,
        label: bookingSkills.slice(0, 3).join(', ') + (bookingSkills.length > 3 ? '…' : ''),
      })
    if (bookingCity || bookingPincode)
      out.push({
        icon: <MapPin className="h-3.5 w-3.5" />,
        label: [bookingCity, bookingPincode].filter(Boolean).join(' · '),
      })
    if (bookingLatitude != null && bookingLongitude != null)
      out.push({
        icon: <MapPin className="h-3.5 w-3.5" />,
        label: 'Geo pin set',
      })
    return out
  }, [bookingCategory, bookingSkills, bookingCity, bookingPincode, bookingLatitude, bookingLongitude])

  return (
    <TooltipProvider delayDuration={250}>
      <Dialog open={open} onOpenChange={(o) => !o && !assigning && onClose()}>
        <DialogContent className="max-h-[min(92vh,920px)] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assign professional to booking
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
            Manual admin assignment — any professional can be assigned regardless of skills, city, verification, or availability.
          </p>
        </DialogHeader>

          {success && (
            <div className="rounded-md border border-storm-deep/40 bg-storm-deep/10 px-3 py-2 text-sm text-storm-deep dark:text-on-ink">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Booking context strip */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {scheduledDateIso ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {(() => {
                    const d = new Date(scheduledDateIso)
                    if (Number.isNaN(d.getTime())) return scheduledDateIso
                    return d.toLocaleString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  })()}
                </span>
              </span>
            ) : null}
            {bookingChips.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {c.icon}
                {c.label}
              </span>
            ))}
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'auto' | 'manual')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="gap-1">
                <Sparkles className="h-4 w-4" />
                Auto-assign (recommended)
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1">
                <User className="h-4 w-4" />
                Manual select
              </TabsTrigger>
            </TabsList>

            {/* ============= AUTO TAB ============= */}
            <TabsContent value="auto" className="space-y-4">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}

              {!loading && !autoPick && (
                <div className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">No strong auto-match yet.</p>
                  <p className="mt-1">
                    No verified professional met the threshold (skills + service area + availability).
                    Switch to <span className="font-medium">Manual select</span> to browse the full list.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setTab('manual')}
                  >
                    Browse manually
                  </Button>
                </div>
              )}

              {!loading && autoPick && (
                <>
                  <CandidateCard
                    match={autoPick}
                    scheduledDateIso={scheduledDateIso}
                    assigning={assigning}
                    isAutoPick
                    onAssign={(professional) => void handleAssign(professional, 'auto')}
                  />
                  {autoRunnerUps.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Runner-ups
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {autoRunnerUps.map((m) => (
                          <CandidateCard
                            key={m.professional._id}
                            match={m}
                            scheduledDateIso={scheduledDateIso}
                            assigning={assigning}
                            onAssign={(professional) => void handleAssign(professional, 'manual')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ============= MANUAL TAB ============= */}
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <Label className="sr-only" htmlFor="ap-search">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ap-search"
                      className="pl-8"
                      placeholder="Search by name or email…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="electrician">Electrician</SelectItem>
                      <SelectItem value="plumber">Plumber</SelectItem>
                      <SelectItem value="carpenter">Carpenter</SelectItem>
                      <SelectItem value="painter">Painter</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="ac_technician">AC Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Availability</Label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Expertise</Label>
                  <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end md:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setHideIneligible((v) => !v)}
                  >
                    {hideIneligible ? 'Show all' : 'Eligible only'}
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}

              {!loading && filteredManual.length === 0 && (
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  No professionals match your filters. Loosen filters or toggle "Show all" to see
                  ineligible candidates with reasons.
                </div>
              )}

              {!loading && filteredManual.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredManual.map((m) => (
                    <CandidateCard
                      key={m.professional._id}
                      match={m}
                      scheduledDateIso={scheduledDateIso}
                      assigning={assigning}
                      isAutoPick={m.professional._id === autoPick?.professional._id}
                      allowIneligibleAssign
                      onAssign={(professional) => void handleAssign(professional, 'manual')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={assigning}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
