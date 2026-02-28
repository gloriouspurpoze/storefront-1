import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Menu,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { servicesService, ServiceRequest, CreateServiceRequest, UpdateServiceRequest } from '../../services/api/services.service'
import { ServiceRequestFormDialog } from '../../components/services/ServiceRequestFormDialog'
import { ServiceRequestDetailsDialog } from '../../components/services/ServiceRequestDetailsDialog'

interface ServiceStats {
  total: number
  open: number
  assigned: number
  inProgress: number
  completed: number
  cancelled: number
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
  
  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuService, setMenuService] = useState<ServiceRequest | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  })

  // Fetch services
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (isMounted) {
        await Promise.all([fetchServices(), fetchStats()])
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [page, rowsPerPage, selectedStatus, selectedUrgency, searchTerm])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      }
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus
      }
      if (selectedUrgency !== 'all') {
        params.urgency = selectedUrgency
      }
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await servicesService.getServices(params)
      setServices(response.serviceRequests || [])
      setTotalCount(response.pagination?.total || 0)
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch service requests', 'error')
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
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, service: ServiceRequest) => {
    setAnchorEl(event.currentTarget)
    setMenuService(service)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuService(null)
  }

  const handleView = (service: ServiceRequest) => {
    setSelectedService(service)
    setDetailsDialogOpen(true)
    handleMenuClose()
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
    handleMenuClose()
  }

  const handleDelete = (service: ServiceRequest) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const confirmDelete = async () => {
    if (!selectedService) return

    try {
      await servicesService.deleteService(selectedService.id)
      showSnackbar('Service request deleted successfully', 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete service request', 'error')
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
        showSnackbar('Service request created successfully', 'success')
      } else if (formMode === 'edit' && selectedService) {
        await servicesService.updateService(selectedService.id, data as UpdateServiceRequest)
        showSnackbar('Service request updated successfully', 'success')
      }
      setFormDialogOpen(false)
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || `Failed to ${formMode} service request`, 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleStatusChange = async (service: ServiceRequest, newStatus: string) => {
    try {
      await servicesService.updateServiceStatus(service.id, newStatus as any)
      showSnackbar(`Service request status updated to ${newStatus}`, 'success')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update status', 'error')
    }
    handleMenuClose()
  }

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'info'
      case 'assigned':
        return 'warning'
      case 'in_progress':
        return 'primary'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`
  }

  const filteredServices = services

  const serviceColumns: StandardTableColumn<ServiceRequest>[] = [
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (_, s) => (
        <>
          <Typography variant="body2" fontWeight="500">
            {s.title}
          </Typography>
          <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
            {s.description}
          </Typography>
        </>
      ),
    },
    {
      id: 'service_type',
      label: 'Service Type',
      sortable: true,
      render: (_, s) => <Chip label={s.service_type} size="small" />,
    },
    {
      id: 'location',
      label: 'Location',
      render: (_, s) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LocationIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {s.location?.city ?? (s as any).location?.city ?? '—'}, {s.location?.state ?? (s as any).location?.state ?? '—'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'urgency',
      label: 'Urgency',
      sortable: true,
      render: (_, s) => (
        <Chip
          label={(s.urgency ?? '').toUpperCase()}
          size="small"
          color={getUrgencyColor(s.urgency ?? '') as any}
        />
      ),
    },
    {
      id: 'budget',
      label: 'Budget',
      render: (_, s) => (
        <Typography variant="body2">
          {formatCurrency(s.budget_min ?? '0')} - {formatCurrency(s.budget_max ?? '0')}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (_, s) => (
        <Chip
          label={String(s.status ?? '').replace('_', ' ').toUpperCase()}
          size="small"
          color={getStatusColor(s.status ?? '') as any}
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      valueGetter: (s) => s.created_at ?? '',
      render: (_, s) => (
        <Typography variant="body2">
          {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Service Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Service Request
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Requests
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="body2">
                Open
              </Typography>
              <Typography variant="h4" color="white">{stats.open}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="body2">
                Assigned
              </Typography>
              <Typography variant="h4" color="white">{stats.assigned}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="body2">
                In Progress
              </Typography>
              <Typography variant="h4" color="white">{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="body2">
                Completed
              </Typography>
              <Typography variant="h4" color="white">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="body2">
                Cancelled
              </Typography>
              <Typography variant="h4" color="white">{stats.cancelled}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={selectedUrgency}
                  label="Urgency"
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                >
                  <MenuItem value="all">All Urgency</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('all')
                  setSelectedUrgency('all')
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
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
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, service)}>
                <MoreVertIcon />
              </IconButton>
            )}
            size="small"
            minHeight={360}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuService && handleView(menuService)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => menuService && handleEdit(menuService)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Request
        </MenuItem>
        <MenuItem onClick={() => menuService && handleStatusChange(menuService, 'assigned')}>
          <AssignIcon sx={{ mr: 1 }} fontSize="small" />
          Assign
        </MenuItem>
        <MenuItem onClick={() => menuService && handleStatusChange(menuService, 'in_progress')}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => menuService && handleStatusChange(menuService, 'completed')}>
          <CompleteIcon sx={{ mr: 1 }} fontSize="small" />
          Mark Completed
        </MenuItem>
        <MenuItem onClick={() => menuService && handleStatusChange(menuService, 'cancelled')}>
          <CancelIcon sx={{ mr: 1 }} fontSize="small" />
          Cancel
        </MenuItem>
        <MenuItem onClick={() => menuService && handleDelete(menuService)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Form Dialog for Create/Edit */}
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

      {/* Details Dialog */}
      <ServiceRequestDetailsDialog
        open={detailsDialogOpen}
        service={selectedService}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedService(null)
        }}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation Dialog */}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
