/**
 * Dialog for admins to assign a professional to a booking
 */

import React, { useState, useEffect } from 'react'
import { Search, User, Star, MapPin, CheckCircle, Loader2 } from 'lucide-react'
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
import { cn } from '../../lib/utils'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { BookingsService } from '../../services/api/bookings.service'
import type { Professional } from '../../types/professional.types'

interface AssignProfessionalDialogProps {
  open: boolean
  onClose: () => void
  bookingId: string
  bookingService?: string
  bookingLocation?: string
  onAssigned?: () => void
}

function availabilityClass(a?: string) {
  switch (a) {
    case 'available':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
    case 'busy':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
    case 'offline':
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    default:
      return ''
  }
}

function expertiseClass(e?: string) {
  switch (e) {
    case 'expert':
      return 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200'
    case 'intermediate':
      return 'border-amber-500/40 bg-amber-500/10'
    case 'beginner':
      return 'border-sky-500/40 bg-sky-500/10'
    default:
      return ''
  }
}

export function AssignProfessionalDialog({
  open,
  onClose,
  bookingId,
  onAssigned,
}: AssignProfessionalDialogProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all')

  useEffect(() => {
    if (open) {
      void loadProfessionals()
    }
  }, [open])

  useEffect(() => {
    applyFilters()
  }, [professionals, searchQuery, categoryFilter, availabilityFilter, expertiseFilter])

  const loadProfessionals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ProfessionalsService.getProfessionals({
        page: 1,
        limit: 100,
        isVerified: true,
      })
      setProfessionals(response.data.professionals || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load professionals')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...professionals]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (prof) =>
          `${prof.firstName} ${prof.lastName}`.toLowerCase().includes(query) ||
          prof.email?.toLowerCase().includes(query)
      )
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.categories?.includes(categoryFilter))
    }

    if (availabilityFilter && availabilityFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.availability === availabilityFilter)
    }

    if (expertiseFilter && expertiseFilter !== 'all') {
      filtered = filtered.filter((prof) => prof.expertiseLevel === expertiseFilter)
    }

    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    setFilteredProfessionals(filtered)
  }

  const handleAssign = async (professionalId: string) => {
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
      setSuccess('Professional assigned successfully!')
      setTimeout(() => {
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !assigning && onClose()}>
      <DialogContent className="max-h-[min(90vh,900px)] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign professional to booking
          </DialogTitle>
        </DialogHeader>

        {success && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-md border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-sm">
          <strong className="text-foreground">Quick assign:</strong>{' '}
          <Button
            type="button"
            size="sm"
            className="ml-2"
            onClick={() => void handleAssign('zillur')}
            disabled={assigning}
          >
            Auto-assign Zillur
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <Label className="sr-only" htmlFor="ap-search">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ap-search"
                className="pl-8"
                placeholder="Search by name or email..."
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
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!loading && filteredProfessionals.length === 0 && (
          <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            No professionals match your filters. Try adjusting search.
          </div>
        )}

        {!loading && filteredProfessionals.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfessionals.map((professional) => (
              <Card key={professional._id} className="flex flex-col">
                <CardContent className="flex-1 space-y-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-14 w-14">
                      {professional.profileImage ? (
                        <AvatarImage src={professional.profileImage} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {professional.firstName[0]}
                        {professional.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">
                        {professional.firstName} {professional.lastName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {(professional.rating || 0).toFixed(1)} ({professional.totalReviews || 0})
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {professional.categories?.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {(professional.categories?.length || 0) > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{professional.categories!.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className={cn('text-xs capitalize', availabilityClass(professional.availability))}>
                      {professional.availability || 'unknown'}
                    </Badge>
                    <Badge variant="outline" className={cn('text-xs capitalize', expertiseClass(professional.expertiseLevel))}>
                      {professional.expertiseLevel || 'unknown'}
                    </Badge>
                  </div>
                  {professional.address && (
                    <p className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {professional.address.area}, {professional.address.city}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {professional.experience} years experience • {professional.completedJobs || 0} jobs
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    type="button"
                    className="w-full gap-1"
                    onClick={() => void handleAssign(professional._id)}
                    disabled={assigning || professional.availability === 'offline'}
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Assign
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
