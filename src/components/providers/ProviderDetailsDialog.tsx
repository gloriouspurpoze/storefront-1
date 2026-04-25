import React from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  Clock,
  CircleSlash2,
  Briefcase,
  Calendar,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import type { ServiceProvider } from '../../types'

interface ProviderDetailsDialogProps {
  open: boolean
  onClose: () => void
  provider: ServiceProvider | null
}

const statusDisplay = (status: string) => {
  switch (status) {
    case 'verified':
      return { variant: 'success' as const, icon: CheckCircle2 }
    case 'pending':
      return { variant: 'warning' as const, icon: Clock }
    case 'rejected':
      return { variant: 'destructive' as const, icon: CircleSlash2 }
    default:
      return { variant: 'secondary' as const, icon: Clock }
  }
}

export function ProviderDetailsDialog({ open, onClose, provider }: ProviderDetailsDialogProps) {
  if (!provider) return null

  const st = statusDisplay(provider.verification_status || 'pending')
  const StIcon = st.icon
  const rating = provider.rating || 0
  const p = provider as unknown as Record<string, unknown>
  const services = (p.services_offered as string[] | undefined) || (p.servicesOffered as string[] | undefined) || []
  const areas = (p.service_areas as string[] | undefined) || (p.serviceAreas as string[] | undefined) || []
  const license = (p.business_license as string | undefined) || (p.businessLicense as string | undefined) || 'Not provided'
  const years = (p.years_experience as number | undefined) ?? (p.yearsExperience as number | undefined) ?? 0
  const bio = p.bio as string | undefined
  const created = new Date(
    (p.created_at as string | undefined) || (p.createdAt as string | undefined) || Date.now(),
  ).toLocaleDateString()
  const updated = new Date(
    (p.updated_at as string | undefined) || (p.updatedAt as string | undefined) || Date.now(),
  ).toLocaleDateString()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl [&>button]:hidden">
        <DialogHeader className="border-b pb-2">
          <DialogTitle className="flex items-center gap-3 pr-8 text-left">
            <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
              <AvatarFallback>
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-lg font-semibold">
                {provider.business_name || 'Unnamed Business'}
              </span>
              <p className="text-sm font-normal text-muted-foreground">
                {provider.user?.firstName} {provider.user?.lastName}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={st.variant} className="inline-flex items-center gap-1">
              <StIcon className="h-3.5 w-3.5" />
              {provider.verification_status
                ? provider.verification_status.charAt(0).toUpperCase() + provider.verification_status.slice(1)
                : 'Unknown'}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-amber-500" />
              {rating.toFixed(1)} ({provider.total_reviews || 0} reviews)
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary">Contact Information</h3>
            <Separator className="my-2" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-start gap-2 p-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{provider.user?.email || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-2 p-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{provider.user?.phone || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary">Business Information</h3>
            <Separator className="my-2" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-start gap-2 p-3">
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Business License</p>
                    <p className="text-sm text-muted-foreground">{license}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-2 p-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Experience</p>
                    <p className="text-sm text-muted-foreground">{years} years</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary">Services Offered</h3>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1">
              {services.length > 0 ? (
                services.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No services listed</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary">Service Areas</h3>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1">
              {areas.length > 0 ? (
                areas.map((area, index) => (
                  <Badge key={index} variant="secondary">
                    <MapPin className="mr-1 h-3 w-3" />
                    {area}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No service areas listed</p>
              )}
            </div>
          </div>

          {bio && (
            <div>
              <h3 className="text-sm font-semibold text-primary">About</h3>
              <Separator className="my-2" />
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">{bio}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-primary">Account Information</h3>
            <Separator className="my-2" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{created}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{updated}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
