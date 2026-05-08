import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  CheckCircle2,
  CircleOff,
  MapPin,
  Timer,
} from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { servicesService, ServiceRequest, CreateServiceRequest, UpdateServiceRequest } from '../../services/api/services.service'
import { ServiceRequestFormDialog } from '../../components/services/ServiceRequestFormDialog'
import { ServiceRequestDetailsDialog } from '../../components/services/ServiceRequestDetailsDialog'
import { formatCurrency } from '../../lib/utils'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'

interface ServiceStats {
  total: number
  open: number
  assigned: number
  inProgress: number
  completed: number
  cancelled: number
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'open':
      return 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100'
    case 'assigned':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
    case 'in_progress':
      return 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100'
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
    default:
      return 'border-border bg-muted/50 text-foreground'
  }
}

function urgencyBadgeClass(urgency: string) {
  switch (urgency) {
    case 'low':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
    case 'high':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
    default:
      return 'border-border bg-muted/50 text-foreground'
  }
}

export function Services() {
  const [services, setServices] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  })

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      if (isMounted) await Promise.all([fetchServices(), fetchStats()])
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [page, rowsPerPage, selectedStatus, selectedUrgency, searchTerm])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = {
        page: page + 1,
        limit: rowsPerPage,
      }
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedUrgency !== 'all') params.urgency = selectedUrgency
      if (searchTerm) params.search = searchTerm

      const response = await servicesService.getServices(params)
      setServices(response.serviceRequests || [])
      setTotalCount(response.pagination?.total || 0)
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to fetch service requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await servicesService.getServiceStats()
      setStats({
        total: response.totalRequests || 0,
        open: response.openRequests || 0,
        assigned: response.assignedRequests || 0,
        inProgress: response.inProgressRequests || 0,
        completed: response.completedRequests || 0,
        cancelled: response.cancelledRequests || 0,
      })
    } catch {
      console.error('Failed to fetch stats')
    }
  }

  const handleView = (service: ServiceRequest) => {
    setSelectedService(service)
    setDetailsDialogOpen(true)
  }

  const handleCreate = () => {
    setFormMode('create')
    setSelectedService(null)
    setFormDialogOpen(true)
  }

  const handleEdit = (service: ServiceRequest) => {
    setFormMode('edit')
    setSelectedService(service)
    setFormDialogOpen(true)
  }

  const handleDelete = (service: ServiceRequest) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedService) return
    try {
      await servicesService.deleteService(selectedService.id)
      appToast('Service request deleted successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to delete service request', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedService(null)
    }
  }

  const handleFormSubmit = async (data: CreateServiceRequest | UpdateServiceRequest) => {
    setFormLoading(true)
    try {
      if (formMode === 'create') {
        await servicesService.createService(data as CreateServiceRequest)
        appToast('Service request created successfully', 'success')
      } else if (formMode === 'edit' && selectedService) {
        await servicesService.updateService(selectedService.id, data as UpdateServiceRequest)
        appToast('Service request updated successfully', 'success')
      }
      setFormDialogOpen(false)
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || `Failed to ${formMode} service request`, 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleStatusChange = async (service: ServiceRequest, newStatus: string) => {
    try {
      await servicesService.updateServiceStatus(service.id, newStatus as 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled')
      appToast(`Service request status updated to ${newStatus}`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: unknown) {
      appToast((error as Error)?.message || 'Failed to update status', 'error')
    }
  }

  const filteredServices = services

  const serviceColumns: StandardTableColumn<ServiceRequest>[] = [
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (_, s) => (
        <div>
          <p className="text-sm font-medium">{s.title}</p>
          <p className="max-w-[200px] truncate text-xs text-muted-foreground">{s.description}</p>
        </div>
      ),
    },
    {
      id: 'service_type',
      label: 'Service Type',
      sortable: true,
      render: (_, s) => (
        <Badge variant="secondary" className="font-normal">
          {s.service_type}
        </Badge>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      render: (_, s) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            {s.location?.city ?? (s as { location?: { city?: string } }).location?.city ?? '—'},{' '}
            {s.location?.state ?? (s as { location?: { state?: string } }).location?.state ?? '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'urgency',
      label: 'Urgency',
      sortable: true,
      render: (_, s) => (
        <Badge variant="outline" className={cn('font-normal', urgencyBadgeClass(s.urgency ?? ''))}>
          {(s.urgency ?? '').toUpperCase()}
        </Badge>
      ),
    },
    {
      id: 'budget',
      label: 'Budget',
      render: (_, s) => (
        <span className="text-sm">
          {formatCurrency(Number(s.budget_min ?? 0))} - {formatCurrency(Number(s.budget_max ?? 0))}
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (_, s) => (
        <Badge variant="outline" className={cn('font-normal capitalize', statusBadgeClass(s.status ?? ''))}>
          {String(s.status ?? '').replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      valueGetter: (s) => s.created_at ?? '',
      render: (_, s) => (
        <span className="text-sm">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</span>
      ),
    },
  ]

  const statCardClass = (tone: 'default' | 'sky' | 'amber' | 'violet' | 'emerald' | 'red') => {
    const map = {
      default: 'border-border bg-card',
      sky: 'border-sky-200 bg-sky-500 text-white dark:border-sky-800 dark:bg-sky-700',
      amber: 'border-amber-200 bg-amber-500 text-white dark:border-amber-800 dark:bg-amber-700',
      violet: 'border-violet-200 bg-violet-500 text-white dark:border-violet-800 dark:bg-violet-700',
      emerald: 'border-emerald-200 bg-emerald-500 text-white dark:border-emerald-800 dark:bg-emerald-700',
      red: 'border-red-200 bg-red-500 text-white dark:border-red-800 dark:bg-red-700',
    }
    return cn('rounded-xl border shadow-sm', map[tone])
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Service Requests</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Service Request
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Card className={statCardClass('default')}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className={statCardClass('sky')}>
          <CardContent className="pt-6">
            <p className="text-sm opacity-90">Open</p>
            <p className="text-2xl font-bold tabular-nums">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className={statCardClass('amber')}>
          <CardContent className="pt-6">
            <p className="text-sm opacity-90">Assigned</p>
            <p className="text-2xl font-bold tabular-nums">{stats.assigned}</p>
          </CardContent>
        </Card>
        <Card className={statCardClass('violet')}>
          <CardContent className="pt-6">
            <p className="text-sm opacity-90">In Progress</p>
            <p className="text-2xl font-bold tabular-nums">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className={statCardClass('emerald')}>
          <CardContent className="pt-6">
            <p className="text-sm opacity-90">Completed</p>
            <p className="text-2xl font-bold tabular-nums">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className={statCardClass('red')}>
          <CardContent className="pt-6">
            <p className="text-sm opacity-90">Cancelled</p>
            <p className="text-2xl font-bold tabular-nums">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 rounded-xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <Label className="sr-only" htmlFor="service-search">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="service-search"
                  className="pl-9"
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 md:col-span-3">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-3">
              <Label>Urgency</Label>
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('all')
                  setSelectedUrgency('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="pt-6">
          <StandardTable<ServiceRequest>
            columns={serviceColumns}
            data={filteredServices}
            getRowId={(row) => row.id ?? ''}
            loading={loading}
            emptyMessage="No service requests found"
            showSearch={false}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={setPage}
            onRowsPerPageChange={(r) => {
              setRowsPerPage(r)
              setPage(0)
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            renderActions={(service) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleView(service)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(service)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleStatusChange(service, 'assigned')}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Assign
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleStatusChange(service, 'in_progress')}>
                    <Timer className="mr-2 h-4 w-4" />
                    Mark In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleStatusChange(service, 'completed')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleStatusChange(service, 'cancelled')}>
                    <CircleOff className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(service)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            size="small"
            minHeight={360}
          />
        </CardContent>
      </Card>

      <ServiceRequestFormDialog
        open={formDialogOpen}
        mode={formMode}
        service={selectedService}
        onClose={() => {
          setFormDialogOpen(false)
          setSelectedService(null)
        }}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      <ServiceRequestDetailsDialog
        open={detailsDialogOpen}
        service={selectedService}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedService(null)
        }}
        onEdit={handleEdit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Service Request"
        message={`Are you sure you want to delete "${selectedService?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setSelectedService(null)
        }}
      />
    </div>
  )
}
