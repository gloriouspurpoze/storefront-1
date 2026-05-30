import React from 'react'
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { formatCurrency } from '../../lib/utils'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export interface Service {
  id: string
  name: string
  description: string
  category: {
    id: string
    name: string
    icon?: string
    color?: string
  }
  price: number
  duration: number
  isActive: boolean
  isFeatured: boolean
  provider?: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  rating: number
  reviewCount: number
  bookingsCount: number
  createdAt: string
  updatedAt?: string
}

interface ServiceTableProps {
  services: Service[]
  onViewService: (service: Service) => void
  onEditService: (service: Service) => void
  onDeleteService: (service: Service) => void
  onToggleActive: (service: Service) => void
  onDuplicateService: (service: Service) => void
  loading?: boolean
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    Plumbing: '🔧',
    Electrical: '⚡',
    Cleaning: '🧹',
    Security: '🔒',
    'Home Repair': '🔨',
    Gardening: '🌱',
    HVAC: '❄️',
    Painting: '🎨',
    Carpentry: '🪚',
    Roofing: '🏠',
  }
  return iconMap[category] || '🛠️'
}

function ServiceRowMenu({
  service,
  onViewService,
  onEditService,
  onDeleteService,
  onToggleActive,
  onDuplicateService,
}: {
  service: Service
} & Pick<
  ServiceTableProps,
  'onViewService' | 'onEditService' | 'onDeleteService' | 'onToggleActive' | 'onDuplicateService'
>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Open actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onSelect={() => {
            onViewService(service)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onEditService(service)
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Service
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onToggleActive(service)
          }}
        >
          {service.isActive ? (
            <ToggleLeft className="mr-2 h-4 w-4" />
          ) : (
            <ToggleRight className="mr-2 h-4 w-4" />
          )}
          {service.isActive ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onDuplicateService(service)
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Service
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => {
            onDeleteService(service)
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Service
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  onViewService,
  onEditService,
  onDeleteService,
  onToggleActive,
  onDuplicateService,
  loading: _loading = false,
}) => {
  const isMobile = useMediaQuery('(max-width: 899px)')

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {services.map((service) => {
          const bg = service.category.color || 'hsl(var(--primary))'
          return (
            <Card key={service.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                      style={{ backgroundColor: bg }}
                    >
                      {getCategoryIcon(service.category.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.category.name}</p>
                    </div>
                  </div>
                  <ServiceRowMenu
                    service={service}
                    onViewService={onViewService}
                    onEditService={onEditService}
                    onDeleteService={onDeleteService}
                    onToggleActive={onToggleActive}
                    onDuplicateService={onDuplicateService}
                  />
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  <Badge variant={service.isActive ? 'success' : 'secondary'}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {service.isFeatured && <Badge variant="warning">Featured</Badge>}
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-semibold text-primary">{formatCurrency(service.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{service.duration}h</p>
                  </div>
                </div>
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-bloom-coral">★</span>
                  <span>
                    {service.rating.toFixed(1)} ({service.reviewCount})
                  </span>
                  <span>· {service.bookingsCount} bookings</span>
                </div>
                {service.provider && (
                  <div className="flex items-center gap-2 border-t border-border pt-2">
                    <Avatar className="h-6 w-6">
                      {service.provider.avatar ? (
                        <AvatarImage src={service.provider.avatar} alt={service.provider.name} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">{service.provider.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {service.provider.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Service Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Bookings</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const bg = service.category.color || 'hsl(var(--primary))'
            return (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ backgroundColor: bg }}
                    >
                      {getCategoryIcon(service.category.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{service.name}</p>
                      {service.provider && (
                        <p className="text-xs text-muted-foreground">by {service.provider.name}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="font-medium"
                    style={
                      service.category.color
                        ? { borderColor: service.category.color, color: service.category.color }
                        : undefined
                    }
                  >
                    {service.category.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(service.price)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{service.duration} hours</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="mb-0.5 flex items-center gap-0.5 text-bloom-coral">
                      <span className="text-sm">★</span>
                      <span className="text-sm text-foreground">{service.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {service.reviewCount} reviews
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold">{service.bookingsCount}</p>
                  <p className="text-xs text-muted-foreground">total bookings</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={service.isActive ? 'success' : 'secondary'}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {service.isFeatured && <Badge variant="warning">Featured</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <ServiceRowMenu
                    service={service}
                    onViewService={onViewService}
                    onEditService={onEditService}
                    onDeleteService={onDeleteService}
                    onToggleActive={onToggleActive}
                    onDuplicateService={onDuplicateService}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
