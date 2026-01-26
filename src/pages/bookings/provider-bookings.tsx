import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  PlayArrow as StartIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'
import { BookingsService } from '../../services/api/bookings.service'
import type { Booking } from '../../types'

export function ProviderBookings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionBooking, setActionBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real bookings data from API
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchBookings()
  }, [currentTab, searchQuery])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = tabs[currentTab].value
      const query: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (status !== 'all') {
        query.status = status
      }
      
      if (searchQuery) {
        query.search = searchQuery
      }
      
      const response = await BookingsService.getProviderBookings(query)
      if (response.success && response.data) {
        setBookings(response.data.bookings || [])
        if (response.data.pagination) {
          setPagination(response.data.pagination)
        }
      } else {
        setBookings([])
      }
      
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(err?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { label: 'All Bookings', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'accepted':
        return 'info'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon fontSize="small" />
      case 'accepted':
      case 'completed':
        return <CheckIcon fontSize="small" />
      case 'cancelled':
        return <CancelIcon fontSize="small" />
      default:
        return <StartIcon fontSize="small" />
    }
  }

  const filteredBookings = bookings

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, booking: Booking) => {
    setActionMenuAnchor(event.currentTarget)
    setActionBooking(booking)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setActionBooking(null)
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
    handleActionMenuClose()
  }

  const handleAcceptBooking = async () => {
    if (!actionBooking) return
    try {
      await BookingsService.updateBookingStatus(actionBooking.id, { status: 'accepted' })
      fetchBookings() // Refresh list
      handleActionMenuClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to accept booking')
    }
  }

  const handleStartJob = async () => {
    if (!actionBooking) return
    try {
      await BookingsService.updateBookingStatus(actionBooking.id, { status: 'in_progress' })
      fetchBookings()
      handleActionMenuClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to start job')
    }
  }

  const handleCompleteJob = async () => {
    if (!actionBooking) return
    try {
      await BookingsService.completeBooking(actionBooking.id)
      fetchBookings()
      handleActionMenuClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to complete job')
    }
  }

  const handleCancelBooking = async () => {
    if (!actionBooking) return
    try {
      await BookingsService.cancelBooking(actionBooking.id, 'Cancelled by provider')
      fetchBookings()
      handleActionMenuClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel booking')
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          My Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your assigned service bookings
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No bookings found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(booking as any).booking_number || booking.bookingNumber || `BK-${booking.id.slice(0, 8)}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {(booking as any).customer_name?.charAt(0) || booking.customerName?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {(booking as any).customer_name || booking.customerName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(booking as any).customer_phone || booking.customerPhone || booking.customer?.phone || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(booking as any).service_name ||
                            booking.serviceName ||
                            (booking as any).service_request?.service_name ||
                            booking.serviceRequest?.title ||
                            'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.category || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(booking as any).scheduled_date || booking.scheduledDate || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(booking as any).scheduled_time || booking.scheduledTime || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(booking as any).service_address || (booking as any).address || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.city || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${(booking as any).total_amount ??
                            booking.totalAmount ??
                            (booking as any).estimated_cost ??
                            booking.estimatedCost ??
                            0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                          icon={getStatusIcon(booking.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, booking)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => actionBooking && handleViewDetails(actionBooking)}>
          View Details
        </MenuItem>
        {actionBooking?.status === 'pending' && (
          <MenuItem onClick={handleAcceptBooking}>Accept Booking</MenuItem>
        )}
        {actionBooking?.status === 'accepted' && (
          <MenuItem onClick={handleStartJob}>Start Job</MenuItem>
        )}
        {actionBooking?.status === 'in_progress' && (
          <MenuItem onClick={handleCompleteJob}>Complete Job</MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleCancelBooking} sx={{ color: 'error.main' }}>
          Cancel Booking
        </MenuItem>
      </Menu>

      {/* Booking Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Booking Detailsssss
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {(selectedBooking as any).booking_number || selectedBooking.bookingNumber || `BK-${selectedBooking.id.slice(0, 8)}`}
                  </Typography>
                  <Chip
                    label={selectedBooking.status}
                    size="small"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {(selectedBooking as any).customer_name || selectedBooking.customerName || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {(selectedBooking as any).customer_phone ||
                        selectedBooking.customerPhone ||
                        selectedBooking.customer?.phone ||
                        'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {(selectedBooking as any).service_address || (selectedBooking as any).address || 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Service Details
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(selectedBooking as any).service_name ||
                        selectedBooking.serviceName ||
                        (selectedBooking as any).service_request?.service_name ||
                        selectedBooking.serviceRequest?.title ||
                        'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedBooking.category || ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {(selectedBooking as any).scheduled_date || selectedBooking.scheduledDate} at{' '}
                      {(selectedBooking as any).scheduled_time || selectedBooking.scheduledTime}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${(selectedBooking as any).total_amount ??
                        selectedBooking.totalAmount ??
                        (selectedBooking as any).estimated_cost ??
                        selectedBooking.estimatedCost ??
                        0}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              {selectedBooking.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{selectedBooking.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedBooking?.status === 'pending' && (
            <Button variant="contained" onClick={handleAcceptBooking}>
              Accept Booking
            </Button>
          )}
          {selectedBooking?.status === 'accepted' && (
            <Button variant="contained" onClick={handleStartJob}>
              Start Job
            </Button>
          )}
          {selectedBooking?.status === 'in_progress' && (
            <Button variant="contained" onClick={handleCompleteJob}>
              Complete Job
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

