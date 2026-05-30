import React from 'react'
import {
  Building2,
  MapPin,
  Star,
  Briefcase,
  BadgeCheck,
  User,
  Mail,
  Phone,
  Clock,
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
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import { formatDate } from '../../lib/utils'

interface ServiceProvider {
  id: string
  userId: string
  businessName: string
  businessLicense?: string
  servicesOffered: string[]
  serviceAreas: string[]
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rating: number
  totalReviews: number
  yearsExperience: number
  bio?: string
  user?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  createdAt: string
  updatedAt?: string
}

interface ServiceDetailsDialogProps {
  open: boolean
  onClose: () => void
  service: ServiceProvider | null
  onEdit?: () => void
}

const statusVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
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

export const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({
  open,
  onClose,
  service,
  onEdit,
}) => {
  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg">Service Provider Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center text-center">
            <Building2 className="mb-2 h-14 w-14 text-primary" />
            <h2 className="text-xl font-semibold">{service.businessName}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Badge variant={statusVariant(service.verificationStatus)} className="capitalize">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                {service.verificationStatus}
              </Badge>
              {service.businessLicense && (
                <Badge variant="outline">License: {service.businessLicense}</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-bloom-coral" />
              {service.rating.toFixed(1)} ({service.totalReviews} reviews)
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <Briefcase className="h-4 w-4" />
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-1">
              {service.servicesOffered.map((serv) => (
                <Badge key={serv}>{serv}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              Service Areas
            </h3>
            <div className="flex flex-wrap gap-1">
              {service.serviceAreas.map((area) => (
                <Badge key={area} variant="outline">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Business Information</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Years of Experience</p>
                    <p className="text-lg font-semibold">{service.yearsExperience} years</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Reviews</p>
                    <p className="text-lg font-semibold">{service.totalReviews}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {service.bio && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">About</h3>
                <p className="text-sm text-muted-foreground">{service.bio}</p>
              </div>
            </>
          )}

          {service.user && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Provider Information</h3>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Provider Name</p>
                        <p className="text-sm font-medium">
                          {service.user.firstName} {service.user.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm">{service.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm">{service.user.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(service.createdAt)}
              </p>
            </div>
            {service.updatedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(service.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && <Button onClick={onEdit}>Edit Service</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
