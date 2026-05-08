import React, { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Separator,
  Avatar,
  HStack,
  VStack,
} from '../../components/ui'
import { AvatarFallback } from '../../components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  CalendarDays,
  MapPin,
  DollarSign,
  Clock,
  ClipboardList,
} from 'lucide-react'
import staticData from '../../data/staticData.json'
import { ServiceRequest } from '../../types'
import { formatCurrency, formatDate, getInitials, cn } from '../../lib/utils'

/** Shape of `serviceRequests` rows in `staticData.json` (snake_case / numeric ids). */
type StaticServiceRequestRow = {
  id: number
  customer_id: number
  service_type: string
  title: string
  description: string
  location: {
    address: string
    city: string
    state: string
    zip_code: string
    coordinates?: { lat: number; lng: number }
  }
  urgency: ServiceRequest['urgency']
  status: ServiceRequest['status']
  budget_min?: number
  budget_max?: number
  preferred_date?: string
  created_at: string
  quotes_count?: number
}

function mapStaticServiceRequest(row: StaticServiceRequestRow): ServiceRequest {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    serviceType: row.service_type,
    title: row.title,
    description: row.description,
    location: {
      address: row.location.address,
      city: row.location.city,
      state: row.location.state,
      zipCode: row.location.zip_code,
      coordinates: row.location.coordinates,
    },
    urgency: row.urgency,
    status: row.status,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    preferredDate: row.preferred_date,
    quotesCount: row.quotes_count,
    createdAt: row.created_at,
  }
}

const urgencyVariant = {
  low: 'secondary' as const,
  medium: 'warning' as const,
  high: 'destructive' as const,
  emergency: 'destructive' as const,
}

const statusVariant = {
  open: 'outline' as const,
  quoted: 'default' as const,
  booked: 'success' as const,
  in_progress: 'warning' as const,
  completed: 'success' as const,
  cancelled: 'destructive' as const,
}

const statDotClass: Record<string, string> = {
  default: 'bg-muted-foreground',
  info: 'bg-sky-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
}

export function ServiceRequests() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [serviceRequests] = useState<ServiceRequest[]>(() =>
    (staticData.serviceRequests as StaticServiceRequestRow[]).map(mapStaticServiceRequest),
  )

  const filteredRequests = serviceRequests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus
    const matchesUrgency = selectedUrgency === 'all' || request.urgency === selectedUrgency
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const requestStats = {
    open: serviceRequests.filter((r) => r.status === 'open').length,
    quoted: serviceRequests.filter((r) => r.status === 'quoted').length,
    booked: serviceRequests.filter((r) => r.status === 'booked').length,
    in_progress: serviceRequests.filter((r) => r.status === 'in_progress').length,
  }

  const StatCard = ({
    title,
    value,
    color = 'default',
  }: {
    title: string
    value: number
    color?: keyof typeof statDotClass
  }) => (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={cn('h-2 w-2 shrink-0 rounded-full', statDotClass[color])} />
          <div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const RequestCard = ({ request }: { request: ServiceRequest }) => (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{request.title}</h3>
              <Badge variant={urgencyVariant[request.urgency]} className="capitalize">
                {request.urgency}
              </Badge>
              <Badge variant={statusVariant[request.status]} className="capitalize">
                {request.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
          </div>
          <HStack spacing={2} className="shrink-0">
            <Button type="button" variant="outline" size="sm">
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
            <Button type="button" variant="outline" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" />
              Quote
            </Button>
          </HStack>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {request.location.city}, {request.location.state}
              </p>
              <p className="text-xs text-muted-foreground">{request.location.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium tabular-nums">
                {formatCurrency((request as ServiceRequest & { budget_min?: number }).budget_min ?? request.budgetMin ?? 0)}{' '}
                - {formatCurrency((request as ServiceRequest & { budget_max?: number }).budget_max ?? request.budgetMax ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Budget range</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {formatDate(
                  (request as ServiceRequest & { preferred_date?: string }).preferred_date ?? request.preferredDate,
                )}
              </p>
              <p className="text-xs text-muted-foreground">Preferred date</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {formatDate((request as ServiceRequest & { created_at?: string }).created_at ?? request.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials('Customer Name')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Customer Name</p>
              <p className="text-xs text-muted-foreground">customer@email.com</p>
            </div>
          </div>

          <HStack spacing={2}>
            <Badge variant="outline">
              {(request as ServiceRequest & { quotes_count?: number }).quotes_count ?? request.quotesCount ?? 0} quotes
            </Badge>
            <Badge variant="outline">
              {(request as ServiceRequest & { service_type?: string }).service_type ?? request.serviceType}
            </Badge>
          </HStack>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Service Requests</h1>
          <p className="text-muted-foreground">Manage and track customer service requests</p>
        </div>
        <HStack spacing={2}>
          <Button type="button" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button type="button">
            <CalendarDays className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </HStack>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Open Requests" value={requestStats.open} color="default" />
        <StatCard title="Quoted" value={requestStats.quoted} color="info" />
        <StatCard title="Booked" value={requestStats.booked} color="success" />
        <StatCard title="In Progress" value={requestStats.in_progress} color="warning" />
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Urgency</label>
              <Select value={selectedUrgency} onValueChange={(v) => setSelectedUrgency(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="button" variant="outline" className="h-10 w-full">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length > 0 ? (
        <VStack spacing={4}>
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </VStack>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No service requests found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedStatus !== 'all' || selectedUrgency !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Service requests will appear here when customers submit them.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
