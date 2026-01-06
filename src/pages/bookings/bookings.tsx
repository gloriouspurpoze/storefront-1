import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
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
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  alpha,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
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
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import { Booking, BookingsQuery } from '../../types'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { BookingsService, ProvidersService } from '../../services/api'
import { AssignProviderModal } from '../../components/bookings/AssignProviderModal'
import { AssignProfessionalDialog } from '../../components/bookings/AssignProfessionalDialog'
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
} as const

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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Modal states
  const [assignProviderModal, setAssignProviderModal] = useState<{
    open: boolean
    bookingId: string | null
  }>({ open: false, bookingId: null })

  const [assignProfessionalModal, setAssignProfessionalModal] = useState<{
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

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const query: BookingsQuery = {
        page,
        limit: 20,
      }

      if (selectedStatus !== 'all') {
        query.status = selectedStatus
      }

      const response = await BookingsService.getBookings(query)
      
      if (response.success && response.data) {
        setBookings(response.data.bookings || [])
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
        }
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, selectedStatus])

  // Filter bookings locally by search term
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.notes?.toLowerCase().includes(searchLower) ||
      booking.serviceRequest?.title?.toLowerCase().includes(searchLower) ||
      booking.id.toString().includes(searchLower)
    )
  })

  // Calculate stats
  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.totalAmount, 0),
  }

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

  const handleEditBooking = (booking: Booking) => {
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
  const StatsCard = ({ title, value, icon: Icon, color, gradient }: any) => (
    <Card 
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        transition: 'all 0.3s ease',
      }}
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
console.log(bookings)
  // Modern Booking Card Component
  const BookingCard = ({ booking }: { booking: Booking }) => {
    const config = statusConfig[booking.status] || statusConfig.pending
    const StatusIcon = config.icon

    return (
      <Card 
        sx={{ 
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
          borderLeft: `4px solid ${config.color}`,
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" fontWeight="600">
                  #{booking.id}
                </Typography>
                <Chip
                  icon={<StatusIcon sx={{ fontSize: 18 }} />}
                  label={config.label}
                  size="small"
                  sx={{
                    bgcolor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: config.color,
                    },
                  }}
                />
              </Box>
              {booking.serviceRequest && (
                <Typography variant="body1" fontWeight="500" color="text.primary">
                  {booking.serviceRequest.title}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More Actions">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, booking)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Info Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                  <CalendarIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {formatDate(booking.scheduledDate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.scheduledTime || 'TBD'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                  <DollarIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color="success.main">
                    {formatCurrency(booking.totalAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.paymentStatus}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'info.light', width: 32, height: 32 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {booking.customer 
                      ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() || 'N/A'
                      : booking.customerId || 'N/A'}
                  </Typography>
                  {booking.customer?.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {booking.customer.phone}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}>
                  <LocationIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2" fontWeight="500" noWrap>
                    {booking.serviceRequest?.location?.city || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.serviceRequest?.location?.state || ''}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

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
            value={bookingStats.total}
            icon={AssignmentIndIcon}
            color="#2196F3"
            gradient="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending"
            value={bookingStats.pending}
            icon={ScheduleIcon}
            color="#FF9800"
            gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="In Progress"
            value={bookingStats.in_progress}
            icon={TimeIcon}
            color="#9C27B0"
            gradient="linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Completed"
            value={bookingStats.completed}
            icon={CheckCircleIcon}
            color="#4CAF50"
            gradient="linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)"
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
                placeholder="Search by booking ID, service, notes..."
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status Filter"
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={loading}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  More Filters
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Loading bookings...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch your bookings
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Bookings List */}
      {!loading && !error && (
        <>
          {filteredBookings.length > 0 ? (
            <Stack spacing={2}>
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No bookings found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Bookings will appear here when customers schedule services.'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

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
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedBooking) {
              handleEditBooking(selectedBooking)
            }
          }}
          disabled={selectedBooking?.status === 'completed' || selectedBooking?.status === 'cancelled'}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Booking
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
