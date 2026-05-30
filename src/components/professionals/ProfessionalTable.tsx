/**
 * ============================================================================
 * PROFESSIONAL TABLE
 * ============================================================================
 * Data table component for displaying professionals
 *
 * @author CTO Team
 * @date November 7, 2025
 */

import React from 'react'
import {
  MoreVertical,
  CheckCircle2,
  Clock,
  CircleSlash2,
  Circle,
  Radio,
} from 'lucide-react'
import { Professional } from '../../types/professional.types'
import { professionalDisplayAccountStatus } from '../../lib/professionalAdmin'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import { CHART_PALETTE } from '../../lib/chartPalette'
import { useProfessionalPresence } from '../../state/professionalPresence'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

interface ProfessionalTableProps {
  professionals: Professional[]
  loading: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, professional: Professional) => void
  onOpenHub?: (professional: Professional) => void
}

const verificationIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle2 className="mr-0.5 h-4 w-4 shrink-0" />
    case 'pending':
      return <Clock className="mr-0.5 h-4 w-4 shrink-0" />
    case 'rejected':
      return <CircleSlash2 className="mr-0.5 h-4 w-4 shrink-0" />
    default:
      return null
  }
}

const verificationBadgeVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
  switch (status) {
    case 'verified':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const expertiseBadgeVariant = (level: string): React.ComponentProps<typeof Badge>['variant'] => {
  switch (level) {
    case 'expert':
      return 'destructive'
    case 'intermediate':
      return 'default'
    case 'beginner':
      return 'secondary'
    default:
      return 'secondary'
  }
}

// DESIGN.md tokens (chartPalette) — no raw hex.
const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'available':
      return CHART_PALETTE.stormDeep
    case 'busy':
      return CHART_PALETTE.bloomCoral
    case 'offline':
    default:
      return CHART_PALETTE.graphite
  }
}

const accountBadgeVariant = (
  status: ReturnType<typeof professionalDisplayAccountStatus>,
): React.ComponentProps<typeof Badge>['variant'] => {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  return 'destructive'
}

/**
 * Live presence cell. Subscribes only to its own professional id so a
 * heartbeat for prof B doesn't re-render prof A's row.
 *
 * Falls back to the persisted `professional.availability` (refreshed by the
 * /professionals list query) when no live heartbeat has arrived yet —
 * matches the static behaviour from before this hook existed.
 */
const AvailabilityCell: React.FC<{ professional: Professional }> = ({ professional }) => {
  const live = useProfessionalPresence(professional._id)
  const status = live?.status ?? professional.availability
  const color = getAvailabilityColor(status)
  const ageMs = live ? Date.now() - live.receivedAt : null
  const isFresh = ageMs != null && ageMs < 90_000
  const tooltipLabel = live
    ? `Live · last heartbeat ${formatHeartbeatAge(ageMs ?? 0)} ago`
    : 'No live heartbeat received this session — value from last sync.'

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1">
            {isFresh ? (
              <Radio
                className="h-3 w-3 shrink-0 animate-pulse"
                style={{ color }}
                aria-hidden
              />
            ) : (
              <Circle
                className="h-2.5 w-2.5 shrink-0 fill-current"
                style={{ color }}
                aria-hidden
              />
            )}
            <span className="text-sm font-medium capitalize" style={{ color }}>
              {status}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function formatHeartbeatAge(ms: number): string {
  if (ms < 1000) return 'just now'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  if (m < 60) return rs ? `${m}m ${rs}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h`
}

export function ProfessionalTable({ professionals, loading, onMenuClick, onOpenHub }: ProfessionalTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading professionals...</p>
        </CardContent>
      </Card>
    )
  }

  if (professionals.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-lg font-medium text-muted-foreground">No professionals found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or create a new professional
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Professional</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Trades</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Expertise</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professionals.map((professional) => {
            const ratingValue =
              professional.rating != null && !Number.isNaN(Number(professional.rating))
                ? Number(professional.rating).toFixed(1)
                : '—'
            const totalReviews = professional.totalReviews ?? 0
            const skills = professional.skills ?? []
            const categories = professional.categories ?? []
            const acct = professionalDisplayAccountStatus(professional)

            return (
              <TableRow
                key={professional._id}
                className="hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      {professional.profileImage ? (
                        <AvatarImage
                          src={professional.profileImage}
                          alt={`${professional.firstName} ${professional.lastName}`}
                        />
                      ) : null}
                      <AvatarFallback>
                        {professional.firstName?.[0]}
                        {professional.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {onOpenHub ? (
                        <button
                          type="button"
                          className="text-left text-sm font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={() => onOpenHub(professional)}
                        >
                          {professional.firstName} {professional.lastName}
                        </button>
                      ) : (
                        <p className="text-sm font-semibold">
                          {professional.firstName} {professional.lastName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{professional.professionalId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{professional.email}</p>
                  <p className="text-xs text-muted-foreground">{professional.phoneNumber}</p>
                </TableCell>
                <TableCell>
                  {professional.isIndependent ? (
                    <Badge variant="secondary">Independent</Badge>
                  ) : professional.serviceProviderId ? (
                    <span className="text-sm">{professional.serviceProviderId.businessName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[200px] flex-wrap gap-0.5">
                    {categories.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs font-normal">
                        {getProfessionalCategoryLabel(cat)}
                      </Badge>
                    ))}
                    {categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{categories.length - 3}
                      </Badge>
                    )}
                    {categories.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[200px] flex-wrap gap-0.5">
                    {skills.slice(0, 2).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{skills.length - 2}
                      </Badge>
                    )}
                    {skills.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={expertiseBadgeVariant(professional.expertiseLevel)} className="capitalize">
                    {professional.expertiseLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{professional.experience} years</span>
                </TableCell>
                <TableCell>
                  <AvailabilityCell professional={professional} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={verificationBadgeVariant(professional.verificationStatus)}
                    className="inline-flex max-w-full items-center gap-0.5 capitalize"
                  >
                    {verificationIcon(professional.verificationStatus)}
                    {professional.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={accountBadgeVariant(acct)} className="capitalize">
                    {acct}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <span className="text-sm font-semibold">⭐ {ratingValue}</span>
                    <span className="text-xs text-muted-foreground">({totalReviews})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="More actions"
                    onClick={(e) => onMenuClick(e, professional)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
