import React, { useMemo, useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Menu,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  alpha,
  Tabs,
  Tab,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as DollarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  AssignmentInd as AssignmentIndIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
} from '@mui/x-data-grid'
import { Booking, BookingsQuery } from '../../types'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { BookingsService, ProvidersService } from '../../services/api'
import { AssignProviderModal } from '../../components/bookings/AssignProviderModal'
import { UpdateBookingStatusModal } from '../../components/bookings/UpdateBookingStatusModal'
import { useNavigate } from 'react-router-dom'

const statusConfig = {
  pending: { 
    color: '#FF9800', 
    bg: '#FFF3E0', 
    icon: ScheduleIcon, 
    label: 'Pending',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  },
  confirmed: { 
    color: '#2196F3', 
    bg: '#E3F2FD', 
    icon: CheckCircleIcon, 
    label: 'Confirmed',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
  },
  in_progress: { 
    color: '#9C27B0', 
    bg: '#F3E5F5', 
    icon: TimeIcon, 
    label: 'In Progress',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
  },
  completed: { 
    color: '#4CAF50', 
    bg: '#E8F5E9', 
    icon: CheckCircleIcon, 
    label: 'Completed',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
  },
  cancelled: { 
    color: '#F44336', 
    bg: '#FFEBEE', 
    icon: CancelIcon, 
    label: 'Cancelled',
    gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
  },
  scheduled: {
    color: '#00ACC1',
    bg: '#E0F7FA',
    icon: CalendarIcon,
    label: 'Scheduled',
    gradient: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
  },
  accepted: {
    color: '#1565C0',
    bg: '#E3F2FD',
    icon: CheckCircleIcon,
    label: 'Accepted',
    gradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
  },
} as const

const statusTabs: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function Bookings() {
  const navigate = useNavigate()
  
  // State management
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [page, setPage] = useState(1) // 1-based (API)
  const [pageSize, setPageSize] = useState(20)
  const [totalRows, setTotalRows] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Modal states
  const [assignProviderModal, setAssignProviderModal] = useState<{
    open: boolean
    bookingId: string | null
  }>({ open: false, bookingId: null })

  const [updateStatusModal, setUpdateStatusModal] = useState<{
    open: boolean
    bookingId: string | null
    currentStatus: string | null
  }>({ open: false, bookingId: null, currentStatus: null })

  const [availableProviders, setAvailableProviders] = useState<any[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)

  const [statsLoading, setStatsLoading] = useState(false)
  const [bookingStats, setBookingStats] = useState<{
    total: number
    byStatus: Record<string, number>
    totalRevenue: number
  } | null>(null)

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const query: BookingsQuery = {
        page,
        limit: pageSize,
      }

      if (selectedStatus !== 'all') {
        query.status = selectedStatus
      }

      const response = await BookingsService.getBookings(query)
      
      if (response.success && response.data) {
        setBookings(response.data.bookings || [])
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.total || 0)
        }
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
      setTotalRows(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, pageSize, selectedStatus])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const response = await BookingsService.getBookingStats()
        if (response.success && response.data) {
          setBookingStats({
            total: response.data.total || 0,
            byStatus: response.data.byStatus || {},
            totalRevenue: response.data.totalRevenue || 0,
          })
        }
      } catch {
        // Non-blocking; keep stats section functional using fallback values.
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])

  // Filter bookings locally by search term
  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
          booking.notes?.toLowerCase().includes(searchLower) ||
          booking.serviceRequest?.title?.toLowerCase().includes(searchLower) ||
          booking.id.toString().includes(searchLower) ||
          booking.bookingNumber?.toLowerCase().includes(searchLower) ||
          booking.customerName?.toLowerCase().includes(searchLower) ||
          booking.customerPhone?.toLowerCase().includes(searchLower) ||
          booking.serviceName?.toLowerCase().includes(searchLower)
        )
      }),
    [bookings, searchTerm]
  )

  const resolvedStats = useMemo(() => {
    // Prefer server stats (accurate across pages), fallback to current list.
    if (bookingStats) {
      return {
        total: bookingStats.total,
        pending: bookingStats.byStatus?.pending || 0,
        confirmed: bookingStats.byStatus?.confirmed || 0,
        scheduled: bookingStats.byStatus?.scheduled || 0,
        accepted: bookingStats.byStatus?.accepted || 0,
        in_progress: bookingStats.byStatus?.in_progress || 0,
        completed: bookingStats.byStatus?.completed || 0,
        cancelled: bookingStats.byStatus?.cancelled || 0,
        revenue: bookingStats.totalRevenue || 0,
      }
    }

    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      scheduled: bookings.filter((b) => b.status === 'scheduled').length,
      accepted: bookings.filter((b) => b.status === 'accepted').length,
      in_progress: bookings.filter((b) => b.status === 'in_progress').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      revenue: bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    }
  }, [bookingStats, bookings])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, booking: Booking) => {
    setAnchorEl(event.currentTarget)
    setSelectedBooking(booking)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedBooking(null)
  }

  const handleRefresh = () => {
    fetchBookings()
  }

  const handleViewBooking = (booking: Booking) => {
    navigate(`/bookings/${booking.id}`)
    handleMenuClose()
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      setLoading(true)
      await BookingsService.cancelBooking(bookingId, 'Cancelled by admin')
      setSnackbar({ open: true, message: 'Booking cancelled successfully', severity: 'success' })
      fetchBookings()
      handleMenuClose()
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel booking', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setPage(1)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const fetchAvailableProviders = async () => {
    try {
      setLoadingProviders(true)
      const response = await ProvidersService.getAvailableProviders({
        limit: 50
      })
      
      if (response.success && response.data) {
        const providers = response.data.providers?.map((provider: any) => ({
          id: provider.id || provider._id,
          businessName: provider.businessName,
          email: provider.businessEmail || provider.email,
          phone: provider.businessPhone || provider.phone,
          rating: provider.averageRating || provider.rating,
          totalJobs: provider.totalJobs || provider.completedJobs || 0,
          verificationStatus: provider.verificationStatus,
          avatar: provider.logo,
        })) || []
        
        setAvailableProviders(providers)
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err)
      setAvailableProviders([])
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleOpenAssignProvider = async (bookingId: string) => {
    setAssignProviderModal({ open: true, bookingId })
    handleMenuClose()
    
    if (availableProviders.length === 0) {
      await fetchAvailableProviders()
    }
  }

  const handleAssignProvider = async (
    providerId: string,
    options: { notifyProvider: boolean; notifyCustomer: boolean }
  ) => {
    if (!assignProviderModal.bookingId) return

    try {
      await BookingsService.assignProvider(
        assignProviderModal.bookingId,
        providerId,
        options
      )
      
      setSnackbar({ 
        open: true, 
        message: 'Provider assigned successfully!', 
        severity: 'success' 
      })
      setAssignProviderModal({ open: false, bookingId: null })
      fetchBookings()
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'Failed to assign provider', 
        severity: 'error' 
      })
    }
  }

  const handleOpenUpdateStatus = (bookingId: string, currentStatus: string) => {
    setUpdateStatusModal({ open: true, bookingId, currentStatus })
    handleMenuClose()
  }

  const handleUpdateStatus = async (
    status: string,
    options: {
      notes?: string
      notifyCustomer: boolean
      notifyProvider: boolean
    }
  ) => {
    if (!updateStatusModal.bookingId) return

    try {
      await BookingsService.adminUpdateBookingStatus(
        updateStatusModal.bookingId,
        status,
        options
      )
      
      setSnackbar({ 
        open: true, 
        message: 'Booking status updated successfully!', 
        severity: 'success' 
      })
      setUpdateStatusModal({ open: false, bookingId: null, currentStatus: null })
      fetchBookings()
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'Failed to update status', 
        severity: 'error' 
      })
    }
  }

  // Modern Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, color, gradient, onClick }: any) => (
    <Card 
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: gradient,
          opacity: 0.1,
          transform: 'translate(30px, -30px)',
        }}
      />
      <CardContent sx={{ position: 'relative' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" color={color}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56,
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )
  const columns = useMemo<GridColDef<Booking>[]>(() => {
    const cols: GridColDef<Booking>[] = [
      {
        field: 'bookingNumber',
        headerName: 'Booking',
        minWidth: 160,
        flex: 1,
        valueGetter: (_value, row) => row.bookingNumber || `#${row.id}`,
        renderCell: (params: GridRenderCellParams<Booking>) => {
          const row = params.row
          return (
            <Box>
              <Typography variant="body2" fontWeight={800}>
                {row.bookingNumber || `#${row.id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(row.createdAt)}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'customerName',
        headerName: 'Customer',
        minWidth: 220,
        flex: 1.2,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Booking>) => {
          const row = params.row
          const name =
            row.customerName ||
            (row.customer ? `${row.customer.firstName || ''} ${row.customer.lastName || ''}`.trim() : '') ||
            'N/A'
          const phone = row.customerPhone || row.customer?.phone || ''
          return (
            <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#667eea', 0.15), color: '#3f51b5' }}>
                {getInitials(name)}
              </Avatar>
              <Box minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {phone}
                </Typography>
              </Box>
            </Box>
          )
        },
      },
      {
        field: 'service',
        headerName: 'Service',
        minWidth: 260,
        flex: 1.6,
        sortable: false,
        valueGetter: (_value, row) =>
          row.serviceRequest?.title || row.serviceName || row.services?.[0]?.serviceName || 'N/A',
        renderCell: (params: GridRenderCellParams<Booking>) => {
          const row = params.row
          const title = row.serviceRequest?.title || row.serviceName || row.services?.[0]?.serviceName || 'N/A'
          const city = row.serviceRequest?.location?.city || row.city || row.address?.city || ''
          const state = row.serviceRequest?.location?.state || ''
          return (
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {city}
                {city && state ? ', ' : ''}
                {state}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'scheduledDate',
        headerName: 'Schedule',
        minWidth: 200,
        flex: 1.1,
        valueGetter: (_value, row) => `${formatDate(row.scheduledDate)} ${row.scheduledTime || ''}`.trim(),
        renderCell: (params: GridRenderCellParams<Booking>) => {
          const row = params.row
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {formatDate(row.scheduledDate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.scheduledTime || 'TBD'}
                </Typography>
              </Box>
            </Box>
          )
        },
      },
      {
        field: 'totalAmount',
        headerName: 'Amount',
        minWidth: 140,
        flex: 0.8,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (v: any) => formatCurrency(v.value || 0),
        renderCell: (params: GridRenderCellParams<Booking>) => (
          <Box textAlign="right" width="100%">
            <Typography variant="body2" fontWeight={900} color="success.main">
              {formatCurrency(params.row.totalAmount || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.paymentStatus || '—'}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 160,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams<Booking>) => {
          const row = params.row
          const cfg = (statusConfig as any)[row.status] || statusConfig.pending
          const StatusIcon = cfg.icon
          return (
            <Chip
              icon={<StatusIcon sx={{ fontSize: 18 }} />}
              label={cfg.label}
              size="small"
              sx={{
                bgcolor: cfg.bg,
                color: cfg.color,
                fontWeight: 800,
                '& .MuiChip-icon': { color: cfg.color },
              }}
            />
          )
        },
      },
      {
        field: 'actions',
        headerName: '',
        width: 92,
        sortable: false,
        filterable: false,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params: GridRenderCellParams<Booking>) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" width="100%">
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/bookings/${params.row.id}`)
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="More">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuOpen(e, params.row)
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ]
    return cols
  }, [navigate])

  const currentTabIndex = useMemo(() => {
    const idx = statusTabs.findIndex((t) => t.value === selectedStatus)
    return idx >= 0 ? idx : 0
  }, [selectedStatus])

  const Toolbar = () => (
    <GridToolbarContainer sx={{ px: 2, py: 1.5, gap: 1.5, alignItems: 'center' }}>
      <Box flex={1}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {totalRows ? `${totalRows.toLocaleString()} bookings` : 'Bookings'}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={loading}
        sx={{ borderRadius: 2 }}
      >
        Refresh
      </Button>
    </GridToolbarContainer>
  )

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Bookings Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all service bookings
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Bookings"
            value={resolvedStats.total}
            icon={AssignmentIndIcon}
            color="#2196F3"
            gradient="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
            onClick={() => handleStatusChange('all')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending"
            value={resolvedStats.pending}
            icon={ScheduleIcon}
            color="#FF9800"
            gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
            onClick={() => handleStatusChange('pending')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="In Progress"
            value={resolvedStats.in_progress}
            icon={TimeIcon}
            color="#9C27B0"
            gradient="linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)"
            onClick={() => handleStatusChange('in_progress')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Completed"
            value={resolvedStats.completed}
            icon={CheckCircleIcon}
            color="#4CAF50"
            gradient="linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)"
            onClick={() => handleStatusChange('completed')}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search booking #, customer, service, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <Tabs
                value={currentTabIndex}
                onChange={(_, idx) => handleStatusChange(statusTabs[idx]?.value || 'all')}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                }}
              >
                {statusTabs.map((t) => (
                  <Tab key={t.value} label={t.label} />
                ))}
              </Tabs>
              {statsLoading && (
                <Typography variant="caption" color="text.secondary">
                  Updating stats…
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Bookings Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 640, width: '100%' }}>
            <DataGrid
              rows={filteredBookings}
              columns={columns}
              getRowId={(row) => row.id || row._id || `${row.serviceRequestId}-${row.scheduledDate}`}
              loading={loading}
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/bookings/${(params.row as Booking).id}`)}
              slots={{ toolbar: Toolbar }}
              paginationMode="server"
              rowCount={totalRows}
              paginationModel={{ page: page - 1, pageSize }}
              onPaginationModelChange={(model) => {
                const nextPage = model.page + 1
                if (nextPage !== page) setPage(nextPage)
                if (model.pageSize !== pageSize) {
                  setPageSize(model.pageSize)
                  setPage(1)
                }
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha('#667eea', 0.06),
                  borderBottom: '1px solid',
                  borderBottomColor: alpha('#000', 0.06),
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: alpha('#2196F3', 0.04),
                },
              }}
              localeText={{
                noRowsLabel:
                  searchTerm || selectedStatus !== 'all'
                    ? 'No bookings match your current filters.'
                    : 'No bookings yet.',
              }}
            />
          </Box>
        </CardContent>
        {!loading && !error && filteredBookings.length === 0 && (
          <Box sx={{ px: 3, pb: 3 }}>
            <Alert severity="info">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search or status filter.'
                : 'Bookings will appear here when customers schedule services.'}
            </Alert>
          </Box>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            minWidth: 180,
            boxShadow: 3,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (selectedBooking) {
              handleViewBooking(selectedBooking)
            }
          }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedBooking) {
              handleOpenAssignProvider(selectedBooking.id)
            }
          }}
          disabled={selectedBooking?.status === 'completed' || selectedBooking?.status === 'cancelled'}
        >
          <AssignmentIndIcon sx={{ mr: 1, fontSize: 20 }} />
          Assign Provider
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedBooking) {
              handleOpenUpdateStatus(selectedBooking.id, selectedBooking.status)
            }
          }}
        >
          <UpdateIcon sx={{ mr: 1, fontSize: 20 }} />
          Update Status
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedBooking) {
              handleCancelBooking(selectedBooking.id)
            }
          }} 
          sx={{ color: 'error.main' }}
          disabled={selectedBooking?.status === 'completed' || selectedBooking?.status === 'cancelled'}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Cancel Booking
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modals */}
      {assignProviderModal.open && assignProviderModal.bookingId && (
        <AssignProviderModal
          open={assignProviderModal.open}
          onClose={() => setAssignProviderModal({ open: false, bookingId: null })}
          bookingId={assignProviderModal.bookingId}
          onAssign={handleAssignProvider}
          availableProviders={availableProviders}
        />
      )}

      {updateStatusModal.open && updateStatusModal.bookingId && updateStatusModal.currentStatus && (
        <UpdateBookingStatusModal
          open={updateStatusModal.open}
          onClose={() => setUpdateStatusModal({ open: false, bookingId: null, currentStatus: null })}
          bookingId={updateStatusModal.bookingId}
          currentStatus={updateStatusModal.currentStatus as any}
          onUpdate={handleUpdateStatus}
        />
      )}
    </Box>
  )
}
