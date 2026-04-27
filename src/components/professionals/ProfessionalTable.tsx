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
} from 'lucide-react'
import { Professional } from '../../types/professional.types'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
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

interface ProfessionalTableProps {
  professionals: Professional[]
  loading: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, professional: Professional) => void
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

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'available':
      return '#16a34a'
    case 'busy':
      return '#ea580c'
    case 'offline':
    default:
      return '#6b7280'
  }
}

export function ProfessionalTable({ professionals, loading, onMenuClick }: ProfessionalTableProps) {
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
            const ac = getAvailabilityColor(professional.availability)

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
                      <p className="text-sm font-semibold">
                        {professional.firstName} {professional.lastName}
                      </p>
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
                  <div className="flex items-center gap-1">
                    <Circle
                      className="h-2.5 w-2.5 shrink-0 fill-current"
                      style={{ color: ac }}
                    />
                    <span className="text-sm font-medium capitalize" style={{ color: ac }}>
                      {professional.availability}
                    </span>
                  </div>
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
