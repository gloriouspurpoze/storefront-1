import React from 'react'
import {
  MapPin,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Mail,
  Image as ImageIcon,
  Clock,
} from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
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
import { ServiceRequest } from '../../services/api/services.service'

interface ServiceRequestDetailsDialogProps {
  open: boolean
  service: ServiceRequest | null
  onClose: () => void
  onEdit?: (service: ServiceRequest) => void
}

const statusVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
  switch (status) {
    case 'open':
      return 'secondary'
    case 'assigned':
      return 'warning'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const urgencyVariant = (urgency: string): React.ComponentProps<typeof Badge>['variant'] => {
  switch (urgency) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function ServiceRequestDetailsDialog({
  open,
  service,
  onClose,
  onEdit,
}: ServiceRequestDetailsDialogProps) {
  if (!service) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const typeLabel = service.service_type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Service Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(service.status)} className="uppercase">
              {service.status.replace('_', ' ')}
            </Badge>
            <Badge variant={urgencyVariant(service.urgency)} className="uppercase">
              {service.urgency} urgency
            </Badge>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>

          <div>
            <h2 className="text-xl font-semibold">{service.title}</h2>
            <p className="mt-1 text-muted-foreground">{service.description}</p>
          </div>

          <Separator />

          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Location</h3>
              </div>
              <p className="text-sm">{service.location.address}</p>
              <p className="text-sm text-muted-foreground">
                {service.location.city}, {service.location.state} {service.location.zip_code}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Budget Range</h3>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(Number(service.budget_min ?? 0))} -{' '}
                  {formatCurrency(Number(service.budget_max ?? 0))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Preferred Date</h3>
                </div>
                <p className="text-sm">
                  {service.preferred_date
                    ? new Date(service.preferred_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not specified'}
                </p>
              </CardContent>
            </Card>
          </div>

          {service.customer && (
            <>
              <Separator />
              <Card>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Customer Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="mb-2 font-medium">
                    {service.customer.firstName} {service.customer.lastName}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {service.customer.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {service.customer.phone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {service.images && service.images.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Images</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt=""
                      className="h-36 w-36 rounded border object-cover"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(service.created_at)}
              </p>
            </div>
            {service.updated_at && service.updated_at !== service.created_at && (
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(service.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onEdit(service)
                onClose()
              }}
            >
              Edit Request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
